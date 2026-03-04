import { NextResponse, NextRequest } from 'next/server';
import { aiChat } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, targetJob } = await request.json();

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    const systemPrompt =
      'You are an ATS (Applicant Tracking System) expert. Analyze the resume text and return JSON with: { score (0-100), issues: [{ type: "critical"|"warning"|"tip", message: string }], keywords: { found: string[], missing: string[], suggested: string[] }, formatting: { score: number, issues: string[] }, sections: { present: string[], missing: string[] } }';

    let userPrompt = `Analyze the following resume for ATS compatibility:\n\n${resumeText}`;

    if (targetJob) {
      userPrompt += `\n\nTarget job role/description: ${targetJob}\n\nInclude keyword matching analysis based on this target job.`;
    }

    try {
      const aiResponse = await aiChat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const analysis = JSON.parse(aiResponse);

      return NextResponse.json(analysis);
    } catch (aiError) {
      console.error('AI analysis failed, returning basic analysis:', aiError);

      const basicAnalysis = {
        score: 50,
        issues: [
          {
            type: 'warning' as const,
            message:
              'AI analysis is temporarily unavailable. This is a basic analysis.',
          },
        ],
        keywords: {
          found: [],
          missing: [],
          suggested: [],
        },
        formatting: {
          score: 50,
          issues: [
            'Unable to perform detailed formatting analysis at this time.',
          ],
        },
        sections: {
          present: [],
          missing: [
            'Contact Information',
            'Summary',
            'Experience',
            'Education',
            'Skills',
          ],
        },
      };

      return NextResponse.json(basicAnalysis);
    }
  } catch (error) {
    console.error('Error in ATS checker:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}
