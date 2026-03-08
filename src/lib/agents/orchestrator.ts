/**
 * Agent Pipeline Orchestrator
 * Coordinates all agents based on user's plan and configuration.
 * Uses the shared AgentContext system for inter-agent handoffs,
 * activity logging, and automation-mode branching.
 */
import { prisma } from '@/lib/db/prisma';
import { isAgentAvailable } from './permissions';
import { runScout } from './scout';
import { analyzeResumeForJob, generateOptimizedResume } from './forge';
import { applyToJob } from './archer';
import { prepareInterview } from './atlas';
import { analyzeSkillGaps } from './sage';
import { reviewApplication } from './sentinel';
import { generateNetworkingSuggestions } from './networkSuggester';
import { calculateApplicationQuality } from '@/lib/jobs/qualityScore';
import { detectScamSignals } from '@/lib/jobs/scamDetector';
import { aiChatWithFallback } from '@/lib/ai/openrouter';
import {
  createAgentContext,
  addToContext,
  logActivity,
  getContextSummary,
  getAgentHandoff,
} from './context';
import type { AutomationMode } from './registry';

interface PipelineConfig {
  userId: string;
  plan: 'BASIC' | 'STARTER' | 'PRO' | 'ULTRA';
  automationMode?: AutomationMode;
}

interface PipelineResult {
  runId: string;
  status: 'completed' | 'failed' | 'partial';
  jobsFound: number;
  jobsApplied: number;
  jobsSkipped: number;
  creditsUsed: number;
  summary: string;
}

/**
 * Check whether an agent should auto-execute in the given automation mode.
 * - copilot:    Only Scout runs automatically. Others produce suggestions.
 * - autopilot:  Scout + Forge + Sentinel run automatically.
 *               Archer applies only to pre-approved categories.
 * - full-agent: Full pipeline runs with minimal intervention.
 */
function shouldAutoRun(
  agentId: 'scout' | 'forge' | 'sentinel' | 'archer' | 'atlas' | 'sage',
  mode: AutomationMode,
): boolean {
  switch (mode) {
    case 'copilot':
      return agentId === 'scout';
    case 'autopilot':
      return ['scout', 'forge', 'sentinel'].includes(agentId);
    case 'full-agent':
      return true;
    default:
      return false;
  }
}

export async function runAgentPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const { userId, plan, automationMode = 'copilot' } = config;

  // Get user's auto-apply config
  const autoConfig = await prisma.autoApplyConfig.findUnique({ where: { userId } });
  if (!autoConfig || !autoConfig.enabled) {
    throw new Error('Auto-apply is not configured or disabled');
  }

  // Check for finalized resume
  const resume = autoConfig.resumeId
    ? await prisma.resume.findUnique({ where: { id: autoConfig.resumeId } })
    : await prisma.resume.findFirst({ where: { userId, isFinalized: true }, orderBy: { updatedAt: 'desc' } });

  if (!resume || !resume.isFinalized) {
    throw new Error('No finalized resume found. Please finalize your resume first.');
  }

  // Check credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCreditsUsed: true, aiCreditsLimit: true, plan: true },
  });
  if (!user) throw new Error('User not found');

  const hasCredits = user.aiCreditsLimit < 0 || user.aiCreditsUsed < user.aiCreditsLimit;
  if (!hasCredits) {
    throw new Error('No AI credits remaining. Please upgrade your plan or purchase credits.');
  }

  const resumeContent = resume.content as any;
  const targetRoles = (autoConfig.targetRoles as string[]) || [];
  const targetLocations = (autoConfig.targetLocations as string[]) || [];
  const excludeCompanies = (autoConfig.excludeCompanies as string[]) || [];
  const excludeKeywords = (autoConfig.excludeKeywords as string[]) || [];

  // Create the run record
  const run = await prisma.autoApplyRun.create({
    data: { userId, status: 'running' },
  });

  // ── Create shared agent context ──
  const ctx = createAgentContext(
    userId,
    run.id,
    {
      targetRole: targetRoles[0] || '',
      skills: resumeContent.skills || [],
      experienceLevel: resumeContent.experienceLevel || 'mid',
      location: targetLocations[0] || '',
    },
    automationMode,
  );

  let jobsFound = 0;
  let jobsApplied = 0;
  let jobsSkipped = 0;
  let creditsUsed = 0;
  let pipelineHadErrors = false;

  try {
    // ── Step 1: Scout discovers jobs (STARTER+) ──
    // Scout always auto-runs in every mode (it's the entry point)
    let discoveredJobs: any[] = [];
    if (isAgentAvailable('scout', plan)) {
      try {
        const scoutResult = await runScout({
          userId,
          targetRoles,
          targetLocations,
          preferRemote: autoConfig.preferRemote,
          minMatchScore: autoConfig.minMatchScore,
          excludeCompanies,
          excludeKeywords,
          limit: 30,
        });
        discoveredJobs = scoutResult.jobs;
        jobsFound = scoutResult.totalFound;

        // Write Scout results to shared context
        addToContext(ctx, 'discoveredJobs', discoveredJobs.map((j: any) => ({
          title: j.title,
          company: j.company,
          matchScore: j.matchScore ?? 0,
          applyUrl: j.url,
          source: j.source,
        })));
        logActivity(ctx, 'scout', 'discovered_jobs', `Found ${discoveredJobs.length} jobs from ${scoutResult.sources?.length ?? 0} sources (${jobsFound} total matches)`);
      } catch (err) {
        console.error('[Orchestrator] Scout failed:', err);
        logActivity(ctx, 'scout', 'error', `Scout failed: ${(err as Error).message}`);
        pipelineHadErrors = true;
        // Continue pipeline — downstream agents can still produce suggestions
      }
    }

    if (discoveredJobs.length === 0) {
      logActivity(ctx, 'scout', 'no_results', 'No matching jobs found in this run');
      const summary = 'No matching jobs found in this run.';
      await prisma.autoApplyRun.update({
        where: { id: run.id },
        data: { status: 'completed', jobsFound: 0, jobsApplied: 0, jobsSkipped: 0, creditsUsed: 0, completedAt: new Date(), summary },
      });
      return { runId: run.id, status: pipelineHadErrors ? 'partial' : 'completed', jobsFound: 0, jobsApplied: 0, jobsSkipped: 0, creditsUsed: 0, summary };
    }

    // Limit to maxAppliesPerRun
    const jobsToProcess = discoveredJobs.slice(0, autoConfig.maxAppliesPerRun);

    // ── Step 2: Forge optimizes resume + Quality Gate (STARTER+) ──
    // Runs automatically in autopilot + full-agent; produces suggestions in copilot
    if (isAgentAvailable('forge', plan) && shouldAutoRun('forge', automationMode)) {
      const _scoutToForgeHandoff = getAgentHandoff(ctx, 'scout', 'forge');
      for (const job of jobsToProcess.slice(0, 5)) { // Optimize for top 5
        try {
          // Analyze resume fit
          const forgeResult = await analyzeResumeForJob(userId, resumeContent, job.title, job.description, job.company);
          const atsScore = forgeResult?.atsScore ?? 0;

          // Generate per-job optimized resume variant
          try {
            const optimizedResume = await generateOptimizedResume(
              userId, resumeContent, job.title, job.description, job.company, forgeResult, ctx,
            );
            // Attach optimized resume to job for Archer
            job._optimizedResume = optimizedResume;
          } catch {
            // Fall back to base resume if variant generation fails
          }

          // Quality gate: score the application before sending
          const scamCheck = detectScamSignals({
            title: job.title, company: job.company, description: job.description, salary: job.salary || null,
          });
          const qualityResult = calculateApplicationQuality({
            matchScore: job.matchScore ?? 0,
            atsScore,
            scamScore: scamCheck.score,
            hasDirectUrl: !!job.url,
            jobAgeDays: 7, // Default estimate
          });

          // Store quality score on job for downstream use
          job._qualityScore = qualityResult.overall;
          job._qualityRecommendation = qualityResult.recommendation;

          // Write to shared context
          addToContext(ctx, 'optimizedResumes', [{
            jobTitle: job.title,
            company: job.company,
            atsScore,
            keywordsAdded: forgeResult?.keywordGaps ?? [],
          }]);
          addToContext(ctx, 'qualityScores', [{
            jobTitle: job.title,
            company: job.company,
            overall: qualityResult.overall,
            recommendation: qualityResult.recommendation,
          }]);
        } catch (err) {
          console.error(`[Orchestrator] Forge failed for ${job.title}:`, err);
          logActivity(ctx, 'forge', 'error', `Forge failed for ${job.title} at ${job.company}: ${(err as Error).message}`);
          pipelineHadErrors = true;
        }
      }
      const applyNowCount = ctx.qualityScores.filter(q => q.recommendation === 'apply_now').length;
      logActivity(ctx, 'forge', 'optimized_resumes', `Optimized ${ctx.optimizedResumes.length} resumes, ${applyNowCount} jobs recommended for immediate application`);
    } else if (isAgentAvailable('forge', plan)) {
      logActivity(ctx, 'forge', 'suggestion', `Forge available but waiting for user approval (${automationMode} mode)`);
    }

    // ── Step 3: Quality Gate + Sentinel review + Archer application (PRO+) ──
    if (isAgentAvailable('archer', plan)) {
      const archerAutoApply = shouldAutoRun('archer', automationMode);

      for (const job of jobsToProcess) {
        // Quality gate: skip low-quality jobs before spending AI credits
        const qualityRec = job._qualityRecommendation as string | undefined;
        if (qualityRec === 'skip') {
          logActivity(ctx, 'archer', 'quality_skip', `Skipped "${job.title}" at ${job.company} — quality too low (score: ${job._qualityScore ?? 0})`);
          jobsSkipped++;
          continue;
        }

        // Check credits before each application
        const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { aiCreditsUsed: true, aiCreditsLimit: true } });
        if (currentUser && currentUser.aiCreditsLimit >= 0 && currentUser.aiCreditsUsed >= currentUser.aiCreditsLimit) {
          logActivity(ctx, 'archer', 'credits_exhausted', 'No AI credits remaining, stopping applications');
          break;
        }

        try {
          // Sentinel review if available (ULTRA)
          let approved = true;
          if (isAgentAvailable('sentinel', plan) && shouldAutoRun('sentinel', automationMode)) {
            const _forgeToSentinelHandoff = getAgentHandoff(ctx, 'forge', 'sentinel');
            const _scoutToSentinelHandoff = getAgentHandoff(ctx, 'scout', 'sentinel');

            const review = await reviewApplication(userId, {
              jobTitle: job.title,
              company: job.company,
              jobDescription: job.description,
              coverLetter: '',
              resumeSummary: resumeContent.summary || '',
              candidateSkills: resumeContent.skills || [],
            }, ctx);
            approved = review.approved;

            addToContext(ctx, 'reviewResults', [{
              jobTitle: job.title,
              approved: review.approved,
              qualityScore: review.qualityScore,
              reasons: review.issues?.map((i: any) => i.message) ?? [],
            }]);
            logActivity(ctx, 'sentinel', review.approved ? 'approved_application' : 'rejected_application',
              `${job.title} at ${job.company}: ${review.approved ? 'approved' : 'rejected'} (quality: ${review.qualityScore}%)`);
          }

          if (!approved) {
            jobsSkipped++;
            continue;
          }

          // In autopilot mode, only apply to pre-approved categories
          if (automationMode === 'autopilot') {
            const jobMatchesApprovedCategory = targetRoles.some(
              (role) => job.title?.toLowerCase().includes(role.toLowerCase()),
            );
            if (!jobMatchesApprovedCategory) {
              logActivity(ctx, 'archer', 'skipped_unapproved', `Skipped ${job.title} — not in pre-approved categories (autopilot mode)`);
              jobsSkipped++;
              continue;
            }
          }

          if (!archerAutoApply) {
            logActivity(ctx, 'archer', 'suggestion', `Ready to apply to ${job.title} at ${job.company} — waiting for user approval (${automationMode} mode)`);
            jobsSkipped++;
            continue;
          }

          // Use optimized resume if available, otherwise base resume
          const resumeToSend = job._optimizedResume || resumeContent;

          const _sentinelToArcherHandoff = getAgentHandoff(ctx, 'sentinel', 'archer');
          const result = await applyToJob(userId, job, resumeToSend, run.id);

          addToContext(ctx, 'applicationsSent', [{
            jobTitle: job.title,
            company: job.company,
            method: result.method === 'none' ? 'email' : result.method,
            status: result.success ? 'sent' : 'failed',
          }]);

          if (result.success) {
            jobsApplied++;
            creditsUsed++;
            logActivity(ctx, 'archer', 'sent_application', `Applied to ${job.title} at ${job.company} via ${result.method} (quality: ${job._qualityScore ?? 'N/A'})`);
            await prisma.user.update({ where: { id: userId }, data: { aiCreditsUsed: { increment: 1 } } });
          } else {
            jobsSkipped++;
            logActivity(ctx, 'archer', 'application_failed', `Failed to apply to ${job.title} at ${job.company}: ${result.details}`);
          }
        } catch (err) {
          console.error(`[Orchestrator] Archer/Sentinel failed for ${job.title}:`, err);
          logActivity(ctx, 'archer', 'error', `Error processing ${job.title}: ${(err as Error).message}`);
          pipelineHadErrors = true;
          jobsSkipped++;
        }
      }
    } else {
      jobsSkipped = jobsToProcess.length;
      logActivity(ctx, 'archer', 'unavailable', `Archer not available on ${plan} plan — jobs discovered but not applied`);
    }

    // ── Step 3b: Networking suggestions for applied jobs ──
    if (jobsApplied > 0 && isAgentAvailable('archer', plan)) {
      try {
        // Build unique company list with job info from sent applications
        const sentApps = ctx.applicationsSent.filter(a => a.status === 'sent');
        const seenCompanies = new Set<string>();
        const targetCompaniesForNetwork: { name: string; jobTitle: string; matchScore: number }[] = [];
        for (const app of sentApps) {
          if (!seenCompanies.has(app.company)) {
            seenCompanies.add(app.company);
            const discoveredJob = ctx.discoveredJobs.find(j => j.company === app.company);
            targetCompaniesForNetwork.push({
              name: app.company,
              jobTitle: app.jobTitle,
              matchScore: discoveredJob?.matchScore ?? 70,
            });
          }
        }

        if (targetCompaniesForNetwork.length > 0) {
          const networkResults = await generateNetworkingSuggestions(userId, {
            targetCompanies: targetCompaniesForNetwork.slice(0, 5),
            userProfile: {
              name: resumeContent.name || '',
              targetRole: targetRoles[0] || '',
              skills: resumeContent.skills || [],
              education: resumeContent.education?.[0]?.school || '',
            },
          });

          if (networkResults.length > 0) {
            addToContext(ctx, 'networkingSuggestions', networkResults.map(n => ({
              company: n.company,
              strategy: n.strategy,
              priority: n.priority,
            })));
            logActivity(ctx, 'archer', 'networking_suggestions', `Generated ${networkResults.length} networking suggestions for ${targetCompaniesForNetwork.length} companies`);
          }
        }
      } catch (err) {
        console.error('[Orchestrator] Networking suggestions failed:', err);
        // Non-critical — don't stop the pipeline
      }
    }

    // ── Step 4: Atlas prepares interview questions for applied jobs (PRO+) ──
    if (isAgentAvailable('atlas', plan) && shouldAutoRun('atlas', automationMode) && jobsApplied > 0) {
      // Context handoff: Archer -> Atlas
      const _archerToAtlasHandoff = getAgentHandoff(ctx, 'archer', 'atlas');
      const appliedJobs = jobsToProcess.slice(0, Math.min(3, jobsApplied));
      for (const job of appliedJobs) {
        try {
          const prep = await prepareInterview(userId, job.title, job.company, job.description, resumeContent.skills || []);

          // Write Atlas results to shared context
          addToContext(ctx, 'interviewPreps', [{
            jobTitle: job.title,
            company: job.company,
            questionsCount: (prep?.technicalQuestions?.length ?? 0) + (prep?.behavioralQuestions?.length ?? 0) + (prep?.roleSpecificQuestions?.length ?? 0),
            topTopics: [
              ...(prep?.technicalQuestions?.slice(0, 2) ?? []),
              ...(prep?.tipsForCompany?.slice(0, 1) ?? []),
            ],
          }]);
        } catch (err) {
          console.error(`[Orchestrator] Atlas failed for ${job.title}:`, err);
          logActivity(ctx, 'atlas', 'error', `Atlas failed for ${job.title}: ${(err as Error).message}`);
          pipelineHadErrors = true;
          // Continue to next job
        }
      }
      logActivity(ctx, 'atlas', 'prepared_interviews', `Prepared ${ctx.interviewPreps.length} interview preps`);
    } else if (isAgentAvailable('atlas', plan) && jobsApplied > 0) {
      logActivity(ctx, 'atlas', 'suggestion', `Atlas available for interview prep — waiting for user approval (${automationMode} mode)`);
    }

    // ── Step 5: Sage identifies skill gaps (ULTRA) ──
    if (isAgentAvailable('sage', plan) && shouldAutoRun('sage', automationMode)) {
      try {
        // Context handoff: Scout -> Sage
        const _scoutToSageHandoff = getAgentHandoff(ctx, 'scout', 'sage');
        const jds = jobsToProcess.slice(0, 3).map((j: any) => j.description);
        const sageResult = await analyzeSkillGaps(userId, resumeContent.skills || [], targetRoles[0] || '', jds);

        // Write Sage results to shared context
        if (sageResult?.gaps) {
          addToContext(ctx, 'skillGaps', sageResult.gaps.map((g: any) => ({
            skill: g.skill,
            currentLevel: g.importance === 'critical' ? 'beginner' : 'intermediate',
            requiredLevel: 'advanced',
            recommendation: g.reason,
          })));
        }
        logActivity(ctx, 'sage', 'identified_gaps', `Identified ${sageResult?.gaps?.length ?? 0} skill gaps (readiness: ${sageResult?.overallReadiness ?? 0}%)`);
      } catch (err) {
        console.error('[Orchestrator] Sage failed:', err);
        logActivity(ctx, 'sage', 'error', `Sage failed: ${(err as Error).message}`);
        pipelineHadErrors = true;
        // Continue — skill gaps are non-critical
      }
    } else if (isAgentAvailable('sage', plan)) {
      logActivity(ctx, 'sage', 'suggestion', `Sage available for skill gap analysis — waiting for user approval (${automationMode} mode)`);
    }

    // ── Generate Cortex run summary using full context ──
    const contextSummary = getContextSummary(ctx);

    let summary = `Found ${jobsFound} jobs`;
    if (jobsApplied > 0) summary += `, applied to ${jobsApplied}`;
    if (jobsSkipped > 0) summary += `, skipped ${jobsSkipped}`;
    if (creditsUsed > 0) summary += `. Used ${creditsUsed} credits.`;

    // Try AI summary — Cortex uses the full context summary
    try {
      const aiSummary = await aiChatWithFallback({ messages: [
        { role: 'system', content: 'You are Cortex, the AI coordinator. Write a brief, friendly 1-2 sentence summary of what your agent team accomplished. Use first person plural (we/our team). Be specific with numbers. Reference agent activities from the pipeline status below.' },
        { role: 'user', content: `${contextSummary}\n\nAutomation mode: ${automationMode}\nJobs found: ${jobsFound}, Applied: ${jobsApplied}, Skipped: ${jobsSkipped}, Credits used: ${creditsUsed}, Top companies: ${jobsToProcess.slice(0, 3).map((j: any) => j.company).join(', ')}` },
      ] }, 'free');
      summary = aiSummary.trim();
    } catch {}

    const finalStatus = pipelineHadErrors ? 'partial' : 'completed';

    // Update run record
    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus === 'partial' ? 'completed' : finalStatus,
        jobsFound,
        jobsApplied,
        jobsSkipped,
        creditsUsed,
        summary,
        completedAt: new Date(),
        details: {
          processedJobs: jobsToProcess.map((j: any) => ({ title: j.title, company: j.company, score: j.matchScore })),
          automationMode,
          pipelineContext: {
            discoveredJobs: ctx.discoveredJobs.length,
            optimizedResumes: ctx.optimizedResumes.length,
            reviewResults: ctx.reviewResults.length,
            applicationsSent: ctx.applicationsSent.length,
            interviewPreps: ctx.interviewPreps.length,
            skillGaps: ctx.skillGaps.length,
            scamJobsFiltered: ctx.scamJobsFiltered,
            qualityScores: ctx.qualityScores.length,
            networkingSuggestions: ctx.networkingSuggestions.length,
            activityLog: ctx.activityLog.length,
            hadErrors: pipelineHadErrors,
          },
        },
      },
    });

    // Update config lastRunAt
    await prisma.autoApplyConfig.update({ where: { userId }, data: { lastRunAt: new Date() } });

    return { runId: run.id, status: finalStatus, jobsFound, jobsApplied, jobsSkipped, creditsUsed, summary };
  } catch (err) {
    console.error('[Orchestrator] Pipeline error:', err);
    logActivity(ctx, 'scout', 'pipeline_error', `Pipeline crashed: ${(err as Error).message}`);
    const failureContextSummary = getContextSummary(ctx);
    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        jobsFound,
        jobsApplied,
        jobsSkipped,
        creditsUsed,
        completedAt: new Date(),
        summary: `Pipeline failed: ${(err as Error).message}`,
        details: {
          automationMode,
          failureContextSummary,
          pipelineContext: {
            discoveredJobs: ctx.discoveredJobs.length,
            optimizedResumes: ctx.optimizedResumes.length,
            reviewResults: ctx.reviewResults.length,
            applicationsSent: ctx.applicationsSent.length,
            interviewPreps: ctx.interviewPreps.length,
            skillGaps: ctx.skillGaps.length,
            scamJobsFiltered: ctx.scamJobsFiltered,
            qualityScores: ctx.qualityScores.length,
            networkingSuggestions: ctx.networkingSuggestions.length,
            activityLog: ctx.activityLog.length,
          },
        },
      },
    });
    return { runId: run.id, status: 'failed', jobsFound, jobsApplied, jobsSkipped, creditsUsed, summary: `Pipeline failed: ${(err as Error).message}` };
  }
}
