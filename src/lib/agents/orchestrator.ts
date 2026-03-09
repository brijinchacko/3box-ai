/**
 * Agent Pipeline Orchestrator
 * Coordinates all agents based on user's plan and configuration.
 * Uses the shared AgentContext system for inter-agent handoffs,
 * activity logging, and automation-mode branching.
 */
import { prisma } from '@/lib/db/prisma';
import { isAgentAvailable } from './permissions';
import { runScout } from './scout';
import { analyzeResumeForJob, generateOptimizedResume, verifyResumeReadiness, quickATSScore } from './forge';
import { applyToJob, applyToJobsBatch } from './archer';
import { prepareInterview } from './atlas';
import { analyzeSkillGaps } from './sage';
import { reviewApplication, verifyJobAlignment } from './sentinel';
import { generateNetworkingSuggestions } from './networkSuggester';
import { calculateApplicationQuality } from '@/lib/jobs/qualityScore';
import { checkDailyCap, consumeDailySlot } from '@/lib/tokens/dailyCap';
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
  status: 'completed' | 'failed' | 'partial' | 'blocked';
  jobsFound: number;
  jobsApplied: number;
  jobsSkipped: number;
  creditsUsed: number;
  summary: string;
  resumeVerification?: {
    passed: boolean;
    completenessScore: number;
    averageAtsScore: number;
    issues: { field: string; severity: string; message: string }[];
    recommendations: string[];
  };
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

  // Check for finalized + approved resume
  const resume = autoConfig.resumeId
    ? await prisma.resume.findUnique({ where: { id: autoConfig.resumeId } })
    : await prisma.resume.findFirst({
        where: { userId, isFinalized: true, approvalStatus: 'approved' },
        orderBy: { updatedAt: 'desc' },
      });

  // Fall back to any finalized resume (legacy resumes without approvalStatus)
  const fallbackResume = !resume
    ? await prisma.resume.findFirst({ where: { userId, isFinalized: true }, orderBy: { updatedAt: 'desc' } })
    : null;

  const activeResume = resume || fallbackResume;

  if (!activeResume || !activeResume.isFinalized) {
    throw new Error('No approved resume found. Please generate and approve your resume in Forge first.');
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

  const resumeContent = activeResume.content as any;
  let targetRoles = (autoConfig.targetRoles as string[]) || [];
  let targetLocations = (autoConfig.targetLocations as string[]) || [];
  const excludeCompanies = (autoConfig.excludeCompanies as string[]) || [];
  const excludeKeywords = (autoConfig.excludeKeywords as string[]) || [];

  // Fall back to CareerTwin targetRoles/location if AutoApplyConfig has none
  if (targetRoles.length === 0 || targetLocations.length === 0) {
    const twin = await prisma.careerTwin.findUnique({
      where: { userId },
      select: { targetRoles: true, skillSnapshot: true },
    });
    if (targetRoles.length === 0 && twin?.targetRoles && Array.isArray(twin.targetRoles)) {
      targetRoles = twin.targetRoles
        .map((r: any) => (typeof r === 'string' ? r : r?.title || ''))
        .filter(Boolean);
    }
    if (targetLocations.length === 0 && twin?.skillSnapshot) {
      const loc = (twin.skillSnapshot as any)?._profile?.location;
      if (loc) targetLocations = [loc];
    }
  }

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
          limit: Math.max(autoConfig.maxAppliesPerRun, 100), // Discover enough for 100+ applications
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
    // Respects perJobResumeRewrite setting — if OFF, only runs free ATS check
    const shouldRewritePerJob = autoConfig.perJobResumeRewrite ?? false;

    if (isAgentAvailable('forge', plan) && shouldAutoRun('forge', automationMode)) {
      const _scoutToForgeHandoff = getAgentHandoff(ctx, 'scout', 'forge');

      if (shouldRewritePerJob) {
        logActivity(ctx, 'forge', 'per_job_rewrite_enabled', `Per-job rewriting is ON — will generate variants for top jobs (2 tokens each)`);
      } else {
        logActivity(ctx, 'forge', 'per_job_rewrite_disabled', `Per-job rewriting is OFF — using base resume for all applications`);
      }

      for (const job of jobsToProcess.slice(0, 5)) { // Optimize for top 5
        try {
          let atsScore = 0;
          let keywordGaps: string[] = [];

          if (shouldRewritePerJob) {
            // Full per-job analysis + variant generation (costs tokens)
            const forgeResult = await analyzeResumeForJob(userId, resumeContent, job.title, job.description, job.company);
            atsScore = forgeResult?.atsScore ?? 0;
            keywordGaps = forgeResult?.keywordGaps ?? [];

            // Generate per-job optimized resume variant
            try {
              const optimizedResume = await generateOptimizedResume(
                userId, resumeContent, job.title, job.description, job.company, forgeResult, ctx,
              );
              // Attach optimized resume to job for Archer
              job._optimizedResume = optimizedResume;

              // Save as ResumeVariant in DB
              try {
                await prisma.resumeVariant.create({
                  data: {
                    resumeId: activeResume.id,
                    userId,
                    jobTitle: job.title,
                    company: job.company,
                    content: optimizedResume as any,
                    atsScore,
                    runId: run.id,
                  },
                });
              } catch { /* non-critical */ }
            } catch {
              // Fall back to base resume if variant generation fails
            }
          } else {
            // Free ATS check only (no AI cost)
            atsScore = await quickATSScore(resumeContent, job.description);
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
            keywordsAdded: keywordGaps,
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

    // ── Step 2.5: Forge Resume Verification Gate ──
    // Verify resume readiness before Archer can apply.
    let resumeVerificationPassed = true;

    if (isAgentAvailable('forge', plan)) {
      try {
        logActivity(ctx, 'forge', 'verifying_resume', 'Verifying resume readiness before applications...');

        const readinessResult = await verifyResumeReadiness(
          userId,
          resumeContent,
          jobsToProcess.slice(0, 10).map((j: any) => ({
            title: j.title,
            description: j.description,
            company: j.company,
          })),
          ctx,
        );

        // Store in context
        ctx.resumeReadiness = {
          ...readinessResult,
          checkedAt: new Date(),
        };

        resumeVerificationPassed = readinessResult.passed;

        if (!readinessResult.passed) {
          logActivity(ctx, 'forge', 'resume_blocked',
            `Resume verification FAILED — Archer will NOT apply. Issues: ${readinessResult.issues.filter(i => i.severity === 'critical').map(i => i.message).join('; ')}`);

          await prisma.agentActivity.create({
            data: {
              userId,
              agent: 'forge',
              action: 'resume_blocked_applications',
              summary: `Applications blocked: Resume failed verification (completeness: ${readinessResult.completenessScore}%, ATS: ${readinessResult.averageAtsScore}%). Fix issues and re-run.`,
              details: {
                completenessScore: readinessResult.completenessScore,
                averageAtsScore: readinessResult.averageAtsScore,
                skillCoveragePercent: readinessResult.skillCoveragePercent,
                issues: readinessResult.issues,
                gaps: readinessResult.gaps,
                recommendations: readinessResult.recommendations,
              },
            },
          });
        } else {
          logActivity(ctx, 'forge', 'resume_approved',
            `Resume verified: completeness ${readinessResult.completenessScore}%, ATS ${readinessResult.averageAtsScore}%, skill coverage ${readinessResult.skillCoveragePercent}%`);
        }
      } catch (err) {
        console.error('[Orchestrator] Resume verification failed:', err);
        logActivity(ctx, 'forge', 'verification_error', `Resume verification error: ${(err as Error).message}. Proceeding with caution.`);
        // On error, allow pipeline to continue
      }
    }

    // If resume verification failed, skip Archer entirely
    if (!resumeVerificationPassed) {
      jobsSkipped = jobsToProcess.length;

      const summary = `Resume verification failed. ${jobsFound} jobs found but applications blocked. Please update your resume and re-run.`;

      await prisma.autoApplyRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          jobsFound,
          jobsApplied: 0,
          jobsSkipped,
          creditsUsed,
          summary,
          completedAt: new Date(),
          details: {
            resumeVerification: ctx.resumeReadiness ? JSON.parse(JSON.stringify(ctx.resumeReadiness)) : null,
            processedJobs: jobsToProcess.map((j: any) => ({ title: j.title, company: j.company, score: j.matchScore })),
            automationMode,
            pipelineContext: {
              discoveredJobs: ctx.discoveredJobs.length,
              optimizedResumes: ctx.optimizedResumes.length,
              reviewResults: 0,
              applicationsSent: 0,
              interviewPreps: 0,
              skillGaps: 0,
              scamJobsFiltered: ctx.scamJobsFiltered,
              qualityScores: ctx.qualityScores.length,
              networkingSuggestions: 0,
              activityLog: ctx.activityLog.length,
              hadErrors: pipelineHadErrors,
            },
          },
        },
      });

      return {
        runId: run.id,
        status: 'blocked',
        jobsFound,
        jobsApplied: 0,
        jobsSkipped,
        creditsUsed,
        summary,
        resumeVerification: {
          passed: false,
          completenessScore: ctx.resumeReadiness?.completenessScore ?? 0,
          averageAtsScore: ctx.resumeReadiness?.averageAtsScore ?? 0,
          issues: ctx.resumeReadiness?.issues ?? [],
          recommendations: ctx.resumeReadiness?.recommendations ?? [],
        },
      };
    }

    // ── Step 3: Quality Gate + Sentinel review + Archer batch application (PRO+) ──
    if (isAgentAvailable('archer', plan)) {
      const archerAutoApply = shouldAutoRun('archer', automationMode);

      // Pre-filter jobs: quality gate, sentinel review, autopilot category check
      const approvedJobs: typeof jobsToProcess = [];

      // ── Step 3.0: Sentinel batch JD-resume alignment check ──
      if (isAgentAvailable('sentinel', plan) && shouldAutoRun('sentinel', automationMode)) {
        try {
          logActivity(ctx, 'sentinel', 'alignment_start', `Checking JD-resume alignment for ${jobsToProcess.length} jobs...`);

          const alignmentResults = await verifyJobAlignment(
            userId,
            jobsToProcess.map((j: any) => ({
              title: j.title,
              company: j.company,
              description: j.description,
            })),
            {
              summary: resumeContent.summary || '',
              skills: resumeContent.skills || [],
              experience: resumeContent.experience || [],
            },
            40, // alignment threshold
            ctx,
          );

          // Store results in context
          addToContext(ctx, 'jobAlignments', alignmentResults);

          // Annotate jobs with alignment data
          for (const alignment of alignmentResults) {
            const job = jobsToProcess.find(
              (j: any) => j.title === alignment.jobTitle && j.company === alignment.company
            );
            if (job) {
              job._alignmentScore = alignment.alignmentScore;
              job._alignmentApproved = alignment.approved;
            }
          }
        } catch (err) {
          console.error('[Orchestrator] Sentinel alignment check failed:', err);
          logActivity(ctx, 'sentinel', 'alignment_error', `Job alignment check failed: ${(err as Error).message}. Proceeding without alignment filter.`);
        }
      }

      for (const job of jobsToProcess) {
        // Quality gate: skip low-quality jobs
        const qualityRec = job._qualityRecommendation as string | undefined;
        if (qualityRec === 'skip') {
          logActivity(ctx, 'archer', 'quality_skip', `Skipped "${job.title}" at ${job.company} — quality too low (score: ${job._qualityScore ?? 0})`);
          jobsSkipped++;
          continue;
        }

        // JD-Resume alignment filter (from Sentinel batch check)
        if (job._alignmentApproved === false) {
          const alignment = ctx.jobAlignments.find(
            a => a.jobTitle === job.title && a.company === job.company
          );
          logActivity(ctx, 'sentinel', 'alignment_skip',
            `Skipped "${job.title}" at ${job.company} — alignment too low (${job._alignmentScore ?? 0}%): ${alignment?.reason ?? 'Poor fit'}`);
          jobsSkipped++;
          continue;
        }

        // Sentinel review if available (ULTRA)
        let approved = true;
        if (isAgentAvailable('sentinel', plan) && shouldAutoRun('sentinel', automationMode)) {
          try {
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
          } catch (err) {
            console.error(`[Orchestrator] Sentinel failed for ${job.title}:`, err);
            // If sentinel fails, approve by default
          }
        }

        if (!approved) { jobsSkipped++; continue; }

        // Autopilot: only approved categories — Archer auto-applies to matching jobs
        if (automationMode === 'autopilot') {
          const jobMatchesApprovedCategory = targetRoles.length === 0 || targetRoles.some(
            (role) => job.title?.toLowerCase().includes(role.toLowerCase()),
          );
          if (!jobMatchesApprovedCategory) {
            logActivity(ctx, 'archer', 'skipped_unapproved', `Skipped ${job.title} — not in pre-approved categories (autopilot mode)`);
            jobsSkipped++;
            continue;
          }
          // Job matches approved category — proceed to apply
        } else if (!archerAutoApply) {
          // Copilot mode — provide suggestion only, don't auto-apply
          logActivity(ctx, 'archer', 'suggestion', `Ready to apply to ${job.title} at ${job.company} — waiting for user approval (${automationMode} mode)`);
          jobsSkipped++;
          continue;
        }

        approvedJobs.push(job);
      }

      // ── Daily cap check — limit jobs to available daily slots ──
      let dailyCapReached = false;
      if (approvedJobs.length > 0) {
        try {
          const dailyCap = await checkDailyCap(userId);
          if (!dailyCap.allowed) {
            logActivity(ctx, 'archer', 'daily_cap_reached', `Daily application limit reached (${dailyCap.used}/${dailyCap.limit}). Skipping all ${approvedJobs.length} jobs.`);
            jobsSkipped += approvedJobs.length;
            approvedJobs.length = 0;
            dailyCapReached = true;
          } else if (!dailyCap.isUnlimited) {
            const slotsAvailable = dailyCap.remaining;
            if (approvedJobs.length > slotsAvailable) {
              const trimmed = approvedJobs.length - slotsAvailable;
              logActivity(ctx, 'archer', 'daily_cap_trim', `Daily cap: ${slotsAvailable} slots remaining. Trimming from ${approvedJobs.length} to ${slotsAvailable} jobs.`);
              jobsSkipped += trimmed;
              approvedJobs.splice(slotsAvailable);
            }
          }
        } catch (err) {
          console.error('[Orchestrator] Daily cap check failed:', err);
          // On error, proceed without cap (don't block the pipeline)
        }
      }

      // ── Batch apply to all approved jobs in parallel ──
      if (approvedJobs.length > 0) {
        logActivity(ctx, 'archer', 'batch_start', `Archer batch applying to ${approvedJobs.length} approved jobs (multi-channel, parallel)`);

        // Use optimized resume for the first few, base resume for the rest
        const resumeForApply = resumeContent;

        try {
          const batchResult = await applyToJobsBatch(
            userId,
            approvedJobs,
            resumeForApply,
            run.id,
            ctx,
            {
              onProgress: (completed, total, lastResult) => {
                // Track credits + consume daily slot
                if (lastResult.success) {
                  creditsUsed++;
                  consumeDailySlot(userId).catch(() => {}); // Fire-and-forget
                }
              },
            },
          );

          jobsApplied = batchResult.applied;
          jobsSkipped += batchResult.failed + batchResult.skipped;

          // Update credits in DB
          if (jobsApplied > 0) {
            await prisma.user.update({ where: { id: userId }, data: { aiCreditsUsed: { increment: jobsApplied } } });
          }

          // Write results to context
          for (const result of batchResult.results) {
            addToContext(ctx, 'applicationsSent', [{
              jobTitle: approvedJobs.find(j => j.id === result.jobApplicationId || batchResult.results.indexOf(result) < approvedJobs.length)?.title || 'Unknown',
              company: approvedJobs.find(j => j.id === result.jobApplicationId || batchResult.results.indexOf(result) < approvedJobs.length)?.company || 'Unknown',
              method: result.method === 'none' ? 'portal' : result.method,
              status: result.success ? 'sent' : 'failed',
            }]);
          }

          logActivity(ctx, 'archer', 'batch_complete',
            `Batch complete: ${batchResult.applied} applied (${batchResult.emailed} emailed, ${batchResult.queued} queued), ${batchResult.failed} failed. ` +
            `Routing: ${batchResult.routingStats.ats_api} ATS API, ${batchResult.routingStats.cold_email} cold email, ${batchResult.routingStats.portal_queue} portal. ` +
            `Cover letters: ${batchResult.coverLetterStats.priority} priority, ${batchResult.coverLetterStats.standard} standard, ${batchResult.coverLetterStats.quick} quick (${batchResult.coverLetterStats.cached} cached). ` +
            `Duration: ${Math.round(batchResult.durationMs / 1000)}s`);
        } catch (err) {
          console.error('[Orchestrator] Archer batch failed:', err);
          logActivity(ctx, 'archer', 'error', `Batch application failed: ${(err as Error).message}`);
          pipelineHadErrors = true;
          jobsSkipped += approvedJobs.length;
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
