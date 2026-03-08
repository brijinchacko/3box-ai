import { NextResponse } from 'next/server';
import { aiChat, AI_MODELS } from '@/lib/ai/openrouter';

/**
 * Conversational onboarding AI — used on homepage hero.
 * Uses premium model for first impressions. No auth required.
 */
export async function POST(req: Request) {
  try {
    const { step, userInput, context } = await req.json();

    if (!step || !userInput) {
      return NextResponse.json({ error: 'step and userInput are required' }, { status: 400 });
    }

    const systemPrompt = `You are Cortex, the AI coordinator at jobTED AI. You lead a team of 6 specialized AI agents that find jobs while users sleep. You're having a warm, encouraging conversation with someone who just visited our career platform. Keep responses SHORT (2-3 sentences max), friendly, and insightful. Include a relevant emoji. Don't be generic — reference their specific input. Be conversational, not corporate.`;

    let userPrompt = '';

    switch (step) {
      case 'role':
        userPrompt = `The user just told me their dream role is: "${userInput}". Give a brief, excited reaction about this career choice. Mention one interesting fact about demand or salary for this role. Keep it to 2 sentences.`;
        break;
      case 'experience':
        userPrompt = `The user wants to become a ${context?.targetRole || 'professional'}. They have ${userInput} of experience. Give a brief encouraging comment based on their experience level. If they're a fresher, be extra encouraging. If experienced, acknowledge their background. Keep it to 2 sentences.`;
        break;
      case 'status':
        userPrompt = `The user wants to be a ${context?.targetRole || 'professional'} with ${context?.experience || 'some'} experience. Their current status is: ${userInput}. Give a brief personalized comment. Keep it to 2 sentences.`;
        break;
      case 'education':
        userPrompt = `The user is pursuing ${context?.targetRole || 'a career'} with ${context?.experience || 'some'} experience, currently ${context?.status || 'exploring'}. Their education: ${userInput}. Give a brief encouraging comment about how their education fits their goals. Keep it to 2 sentences.`;
        break;
      case 'skills':
        userPrompt = `The user wants to be a ${context?.targetRole || 'professional'}. They selected these skills: ${userInput}. Give a brief assessment of their skill mix and one suggestion for a skill they might want to add. Keep it to 2 sentences.`;
        break;
      default:
        userPrompt = `The user said: "${userInput}". Give a brief, relevant response.`;
    }

    const response = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: AI_MODELS.standard.id,
      temperature: 0.8,
      maxTokens: 150,
    });

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('[Onboarding Chat]', error);
    // Return a fallback message so the UX doesn't break
    return NextResponse.json({ message: '' });
  }
}
