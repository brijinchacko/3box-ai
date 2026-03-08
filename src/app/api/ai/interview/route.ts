import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChat, getModelForFeature, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { TOKEN_COSTS, canAfford } from '@/lib/tokens/pricing';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, aiCreditsUsed: true, aiCreditsLimit: true },
    });
    const userPlan = user?.plan || 'BASIC';
    const model = getModelForFeature('interview', userPlan);

    const body = await req.json();
    const { action, targetRole, jobDescription, answer, question, questionsCount } = body;

    if (!action || !targetRole) {
      return NextResponse.json(
        { error: 'action and targetRole are required' },
        { status: 400 }
      );
    }

    // Token cost depends on action
    const cost = action === 'generate' ? TOKEN_COSTS.interview_prep : TOKEN_COSTS.interview_evaluate;
    if (!canAfford(user?.aiCreditsUsed ?? 0, user?.aiCreditsLimit ?? 0, cost)) {
      return NextResponse.json(
        { error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS', required: cost, remaining: Math.max(0, (user?.aiCreditsLimit ?? 0) - (user?.aiCreditsUsed ?? 0)) },
        { status: 402 }
      );
    }

    // Build user context for AI personalization
    const userContext = await getUserContextString(session.user.id);

    if (action === 'generate') {
      const count = questionsCount || 5;
      const systemPrompt = `You are an expert interview coach. Generate ${count} interview questions for the role of "${targetRole}". Include a mix of:
- Behavioral questions (STAR method format)
- Technical questions relevant to the role
- Situational/case questions

${jobDescription ? `Job description context: ${jobDescription}` : ''}

Return a valid JSON array with format:
[{
  "id": "<unique_id>",
  "type": "behavioral"|"technical"|"situational",
  "question": "<question text>",
  "difficulty": "easy"|"medium"|"hard",
  "timeLimit": <seconds 60-180>,
  "hints": ["<hint1>", "<hint2>"],
  "keyPoints": ["<point to cover>", "<point to cover>"]
}]${userContext ? `\n\n${userContext}\n\nUse the above user context to tailor questions to the candidate's actual experience level and background.` : ''}`;

      const aiResponse = await aiChat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} interview questions for: ${targetRole}` },
        ],
        model: model.id,
        temperature: 0.7,
        jsonMode: model.supportsJsonMode,
      });

      let questions;
      try {
        questions = JSON.parse(extractJSON(aiResponse));
      } catch {
        questions = generateFallbackQuestions(targetRole, count);
      }

      // Ensure all questions have the required fields
      questions = questions.map((q: any, i: number) => ({
        id: q.id || String(i + 1),
        question: q.question,
        type: q.type || 'behavioral',
        difficulty: q.difficulty || 'medium',
        timeLimit: q.timeLimit || 120,
        hints: q.hints || q.tips ? [q.tips] : ['Take a moment to structure your thoughts', 'Use specific examples'],
        keyPoints: q.keyPoints || ['Clarity', 'Relevance', 'Depth'],
      }));

      // Deduct tokens
      await prisma.user.update({
        where: { id: session.user.id },
        data: { aiCreditsUsed: { increment: cost } },
      });

      return NextResponse.json({ questions });
    }

    if (action === 'evaluate') {
      if (!answer || !question) {
        return NextResponse.json(
          { error: 'answer and question are required for evaluation' },
          { status: 400 }
        );
      }

      const systemPrompt = `You are an expert interview evaluator. Evaluate the candidate's answer to an interview question for the role of "${targetRole}". Be constructive and specific. The score should reflect real interview standards.

Return valid JSON:
{
  "score": <number 1-10>,
  "feedback": "<detailed constructive feedback in 2-3 sentences>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<area1>", "<area2>"],
  "improvedAnswer": "<a model answer demonstrating best practices, 3-4 sentences>"
}${userContext ? `\n\n${userContext}\n\nUse the above user context to provide personalized feedback based on the candidate's actual background and experience.` : ''}`;

      const aiResponse = await aiChat({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Role: ${targetRole}\nQuestion: "${question}"\nCandidate's answer: "${answer}"`,
          },
        ],
        model: model.id,
        temperature: 0.4,
        jsonMode: model.supportsJsonMode,
      });

      let evaluation;
      try {
        evaluation = JSON.parse(extractJSON(aiResponse));
      } catch {
        evaluation = generateFallbackEvaluation();
      }

      // Deduct tokens
      await prisma.user.update({
        where: { id: session.user.id },
        data: { aiCreditsUsed: { increment: cost } },
      });

      return NextResponse.json({
        score: evaluation.score || 6,
        feedback: evaluation.feedback || 'Your answer covers the basics but could be more structured.',
        strengths: evaluation.strengths || ['Showed relevant knowledge', 'Addressed the core question'],
        improvements: evaluation.improvements || ['Add more specific examples', 'Use structured frameworks'],
        improvedAnswer: evaluation.improvedAnswer || 'Consider structuring your answer with a clear situation, action, and result to make it more impactful.',
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "generate" or "evaluate"' }, { status: 400 });
  } catch (error) {
    console.error('[Interview API]', error);
    return NextResponse.json(
      { error: 'Failed to process interview request' },
      { status: 500 }
    );
  }
}

function generateFallbackQuestions(targetRole: string, count: number) {
  const allQuestions = [
    { id: '1', question: `Tell me about a challenging project you worked on that is relevant to ${targetRole}. What was your role and what was the outcome?`, type: 'behavioral', difficulty: 'medium', timeLimit: 120, hints: ['Use the STAR method', 'Focus on your specific contributions'], keyPoints: ['Situation context', 'Actions taken', 'Measurable results'] },
    { id: '2', question: `How would you design a scalable system architecture for a high-traffic application?`, type: 'technical', difficulty: 'hard', timeLimit: 180, hints: ['Consider load balancing', 'Think about caching strategies'], keyPoints: ['Architecture overview', 'Scalability considerations', 'Trade-offs discussed'] },
    { id: '3', question: `Your team disagrees on a technical approach for a critical feature. How would you handle this situation?`, type: 'situational', difficulty: 'medium', timeLimit: 120, hints: ['Show leadership skills', 'Emphasize collaboration'], keyPoints: ['Communication approach', 'Decision-making process', 'Team alignment'] },
    { id: '4', question: `What are the key technical skills you bring to the ${targetRole} position and how have you applied them?`, type: 'behavioral', difficulty: 'easy', timeLimit: 90, hints: ['Align with job requirements', 'Give specific examples'], keyPoints: ['Relevant skills', 'Supporting evidence', 'Growth mindset'] },
    { id: '5', question: `You discover a critical bug in production right before a major release. Walk me through your response.`, type: 'situational', difficulty: 'hard', timeLimit: 150, hints: ['Prioritize communication', 'Show systematic debugging'], keyPoints: ['Immediate actions', 'Stakeholder communication', 'Root cause analysis'] },
    { id: '6', question: `Explain a complex technical concept you've worked with to a non-technical stakeholder.`, type: 'behavioral', difficulty: 'medium', timeLimit: 120, hints: ['Use analogies', 'Avoid jargon'], keyPoints: ['Simplification ability', 'Communication clarity', 'Audience awareness'] },
    { id: '7', question: `What is your approach to writing maintainable and testable code?`, type: 'technical', difficulty: 'medium', timeLimit: 120, hints: ['Mention design patterns', 'Discuss testing strategies'], keyPoints: ['Code organization', 'Testing practices', 'Documentation'] },
    { id: '8', question: `A key team member leaves mid-project. How do you ensure the project stays on track?`, type: 'situational', difficulty: 'hard', timeLimit: 150, hints: ['Focus on knowledge transfer', 'Show adaptability'], keyPoints: ['Risk mitigation', 'Resource management', 'Timeline adjustment'] },
  ];
  return allQuestions.slice(0, count);
}

function generateFallbackEvaluation() {
  return {
    score: 6,
    feedback: 'Your answer covers the basics but could be more structured. Consider using the STAR method for behavioral questions and being more specific with concrete examples and measurable outcomes.',
    strengths: ['Showed relevant knowledge', 'Addressed the core question directly'],
    improvements: ['Add more specific examples with quantifiable results', 'Use structured frameworks like STAR', 'Demonstrate deeper technical understanding'],
    improvedAnswer: 'A stronger answer would start with the specific situation and context, describe your exact role and the actions you took, highlight the tools and methods used, and conclude with quantifiable results and key lessons learned that you applied going forward.',
  };
}
