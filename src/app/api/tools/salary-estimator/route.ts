import { NextResponse, NextRequest } from 'next/server';
import { aiChat } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { role, location, experience, skills } = await request.json();

    if (!role || !location || !experience) {
      return NextResponse.json(
        { error: 'Role, location, and experience are required' },
        { status: 400 }
      );
    }

    const systemPrompt =
      'You are a salary data expert. Based on the role, location, and experience level, provide a salary estimate. Return JSON: { low: number, median: number, high: number, currency: "USD", factors: string[], marketTrend: "growing"|"stable"|"declining", demandLevel: "high"|"medium"|"low" }';

    let userPrompt = `Estimate the salary range for the following:\n\nRole: ${role}\nLocation: ${location}\nExperience: ${experience}`;

    if (skills && Array.isArray(skills) && skills.length > 0) {
      userPrompt += `\nSkills: ${skills.join(', ')}`;
    }

    try {
      const aiResponse = await aiChat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const estimate = JSON.parse(aiResponse);

      return NextResponse.json(estimate);
    } catch (aiError) {
      console.error(
        'AI estimation failed, returning reasonable defaults:',
        aiError
      );

      const defaultEstimate = {
        low: 50000,
        median: 75000,
        high: 100000,
        currency: 'USD',
        factors: [
          'AI estimation is temporarily unavailable.',
          'These are placeholder values.',
          'Please try again later for accurate estimates.',
        ],
        marketTrend: 'stable' as const,
        demandLevel: 'medium' as const,
      };

      return NextResponse.json(defaultEstimate);
    }
  } catch (error) {
    console.error('Error in salary estimator:', error);
    return NextResponse.json(
      { error: 'Failed to estimate salary' },
      { status: 500 }
    );
  }
}
