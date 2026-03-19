import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChat, getModelForFeature, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { checkFeatureGate } from '@/lib/tokens/featureGate';

const { prisma } = require('@/lib/db/prisma');

const SECTION_PROMPTS: Record<string, (targetJob?: string) => string> = {
  summary: (targetJob) =>
    `You are an expert resume writer and ATS specialist. Rewrite the following professional summary to be compelling, concise, and ATS-friendly.${targetJob ? ` Optimize for the target role: ${targetJob}.` : ''} Focus on measurable achievements and relevant keywords. Return JSON: { "enhanced": "<rewritten summary>", "suggestions": ["<suggestion 1>", "<suggestion 2>", ...] }`,
  experience: (targetJob) =>
    `You are an expert resume writer. Enhance the following experience bullet points with strong action verbs, quantifiable metrics, and achievement-oriented language.${targetJob ? ` Tailor for the target role: ${targetJob}.` : ''} Transform passive descriptions into powerful impact statements. Return JSON: { "enhanced": "<enhanced experience section>", "suggestions": ["<suggestion 1>", "<suggestion 2>", ...] }`,
  skills: (targetJob) =>
    `You are an ATS optimization specialist. Optimize the following skills list for maximum ATS compatibility.${targetJob ? ` Target role: ${targetJob}. Prioritize skills that match this role and add commonly expected skills that are missing.` : ''} Group skills by category and prioritize the most relevant ones. Return JSON: { "enhanced": "<optimized skills section>", "suggestions": ["<suggestion 1>", "<suggestion 2>", ...] }`,
  full: (targetJob) =>
    `You are a professional resume writer and ATS optimization expert. Enhance the resume to be professional, ATS-friendly, and compelling.${targetJob ? ` Tailor specifically for the target role: ${targetJob}.` : ''} Improve wording, add metrics where possible, use strong action verbs, and optimize keywords.

Return a JSON object with this EXACT structure:
{
  "summary": "enhanced professional summary text",
  "experience": [
    {
      "role": "job title",
      "company": "company name",
      "bullets": ["enhanced bullet 1", "enhanced bullet 2", "enhanced bullet 3"]
    }
  ],
  "skills": ["skill1", "skill2"],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"]
}

IMPORTANT: Return ONLY valid JSON. The experience array must match the same jobs in the same order as the input. Each bullet should start with a strong action verb and include metrics where possible.`,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gate = await checkFeatureGate(session.user.id);
    if (gate.locked) {
      return NextResponse.json({ error: gate.reason || 'Free plan limit reached. Please upgrade.' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { section, content, targetJob } = body;

    if (!section || !content) {
      return NextResponse.json(
        { error: 'section and content are required' },
        { status: 400 },
      );
    }

    const validSections = ['summary', 'experience', 'skills', 'full'];
    if (!validSections.includes(section)) {
      return NextResponse.json(
        {
          error: `Invalid section. Must be one of: ${validSections.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Build user context for AI personalization
    const userContext = await getUserContextString(session.user.id);

    let result: { enhanced: string; suggestions: string[] };
    try {
      let systemPrompt = SECTION_PROMPTS[section](targetJob);
      if (userContext) {
        systemPrompt += `\n\n${userContext}\n\nIMPORTANT: Use the user's real name, skills, experience, and career goals from the context above to personalize the enhanced content. Write in first person using their actual details.`;
      }
      const model = getModelForFeature('resume', user.plan);
      const aiResponse = await aiChat({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Here is the ${section} content to enhance:\n\n${content}`,
          },
        ],
        model: model.id,
        temperature: 0.5,
        jsonMode: model.supportsJsonMode,
      });

      try {
        result = JSON.parse(extractJSON(aiResponse));
      } catch {
        // Fallback: treat the full response as the enhanced text
        result = {
          enhanced: aiResponse,
          suggestions: [
            'AI response was returned as plain text. Consider reviewing the formatting.',
          ],
        };
      }
    } catch (aiError) {
      console.warn('[Resume Enhance] AI generation failed, using demo enhancement:', aiError);
      // Demo fallback when AI is unavailable
      const enhancementMap: Record<string, (text: string) => { enhanced: string; suggestions: string[] }> = {
        summary: (text) => ({
          enhanced: `Results-driven professional with demonstrated expertise in ${targetJob || 'the field'}. ${text.split('.').slice(0, 2).join('. ').trim()}. Proven track record of delivering impactful results and driving team success.`,
          suggestions: [
            'Add quantifiable achievements (e.g., "increased efficiency by 30%")',
            'Include industry-specific keywords for ATS optimization',
            'Keep summary to 3-4 impactful sentences',
          ],
        }),
        experience: (text) => ({
          enhanced: text.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            if (/^(led|built|managed|developed|created|implemented)/i.test(trimmed)) return trimmed;
            return `Spearheaded ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
          }).filter(Boolean).join('\n'),
          suggestions: [
            'Start each bullet with a strong action verb (Led, Built, Managed, Developed)',
            'Add metrics and numbers wherever possible',
            'Focus on outcomes and impact, not just responsibilities',
          ],
        }),
        skills: (text) => ({
          enhanced: text,
          suggestions: [
            'Group skills by category (Technical, Soft Skills, Tools)',
            'Prioritize skills mentioned in job descriptions you\'re targeting',
            'Remove outdated or irrelevant skills',
            `Add trending skills for ${targetJob || 'your target role'}`,
          ],
        }),
        full: (text) => ({
          enhanced: text,
          suggestions: [
            'Tailor your resume for each application',
            'Use consistent formatting throughout',
            'Ensure contact information is current and professional',
            'Add a compelling professional summary at the top',
          ],
        }),
      };
      result = (enhancementMap[section] || enhancementMap.full)(content);
      result.suggestions.unshift('[Demo Mode] AI enhancement is running with sample suggestions. Configure OpenRouter API key for full AI-powered optimization.');
    }

    return NextResponse.json({
      enhanced: result.enhanced,
      suggestions: result.suggestions || [],
    });
  } catch (error) {
    console.error('[Resume Enhance API]', error);
    return NextResponse.json(
      { error: 'Failed to enhance resume section' },
      { status: 500 },
    );
  }
}
