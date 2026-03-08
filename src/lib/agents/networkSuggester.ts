/**
 * Networking Suggestions Generator
 * Produces actionable networking strategies after applications are sent.
 * Uses AI for personalized connection messages.
 */
import { prisma } from '@/lib/db/prisma';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';
import { type AgentContext, logActivity } from './context';

export interface NetworkingSuggestion {
  company: string;
  strategy: 'linkedin_connect' | 'cold_email_employee' | 'alumni_network' | 'meetup';
  suggestedMessage: string;
  targetRole: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface NetworkingInput {
  targetCompanies: { name: string; jobTitle: string; matchScore: number }[];
  userProfile: {
    name: string;
    targetRole: string;
    skills: string[];
    education?: string;
    currentTitle?: string;
  };
}

/**
 * Generate networking suggestions for recently applied companies
 */
export async function generateNetworkingSuggestions(
  userId: string,
  input: NetworkingInput,
  ctx?: AgentContext,
): Promise<NetworkingSuggestion[]> {
  if (input.targetCompanies.length === 0) return [];

  // Take top 5 companies by match score
  const topCompanies = [...input.targetCompanies]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const companiesText = topCompanies
    .map(c => `- ${c.name}: ${c.jobTitle} (match: ${c.matchScore}%)`)
    .join('\n');

  const prompt = `Generate networking strategies for these companies where the candidate has applied.

CANDIDATE:
Name: ${input.userProfile.name}
Current title: ${input.userProfile.currentTitle || 'Job seeker'}
Target role: ${input.userProfile.targetRole}
Key skills: ${input.userProfile.skills.slice(0, 8).join(', ')}
Education: ${input.userProfile.education || 'Not specified'}

COMPANIES APPLIED TO:
${companiesText}

For each company, suggest ONE networking action. Respond in JSON array:
[{
  "company": "<company name>",
  "strategy": "linkedin_connect|cold_email_employee|alumni_network|meetup",
  "suggestedMessage": "<ready-to-send connection message, 2-3 sentences, personalized>",
  "targetRole": "<who to connect with, e.g., 'Engineering Manager', 'Recruiter'>",
  "priority": "high|medium|low",
  "reason": "<why this strategy for this company>"
}]

Rules:
- Keep messages under 300 characters (LinkedIn limit)
- Be genuine, not salesy — mention shared interests or the role applied for
- "high" priority for top match companies
- Use "alumni_network" only if education info suggests a connection
- Never fabricate any details about the candidate`;

  try {
    const response = await aiChatWithFallback({ messages: [
      { role: 'system', content: `You are a career networking advisor. Generate specific, actionable networking suggestions.

IMPORTANT:
- Never fabricate candidate details or company information
- Keep LinkedIn messages under 300 characters
- Be professional but personable
- Focus on genuine value the candidate can bring
- Prioritize companies with highest match scores

OUTPUT: Valid JSON array.` },
      { role: 'user', content: prompt },
    ] }, 'free');

    const suggestions = JSON.parse(extractJSON(response)) as NetworkingSuggestion[];

    // Validate and sanitize
    const validated = Array.isArray(suggestions)
      ? suggestions.slice(0, 5).map(s => ({
          company: String(s.company || ''),
          strategy: (['linkedin_connect', 'cold_email_employee', 'alumni_network', 'meetup'].includes(s.strategy)
            ? s.strategy
            : 'linkedin_connect') as NetworkingSuggestion['strategy'],
          suggestedMessage: String(s.suggestedMessage || '').slice(0, 500),
          targetRole: String(s.targetRole || 'Hiring Manager'),
          priority: (['high', 'medium', 'low'].includes(s.priority) ? s.priority : 'medium') as 'high' | 'medium' | 'low',
          reason: String(s.reason || ''),
        }))
      : [];

    // Log activity
    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'archer',
        action: 'networking_suggestions',
        summary: `Generated ${validated.length} networking suggestions for ${topCompanies.map(c => c.name).join(', ')}`,
        details: {
          companies: topCompanies.map(c => c.name),
          strategies: validated.map(s => s.strategy),
        },
      },
    });

    if (ctx) {
      logActivity(ctx, 'archer', 'networking_suggestions',
        `Generated ${validated.length} networking suggestions: ${validated.map(s => `${s.strategy} at ${s.company}`).join(', ')}`);
    }

    return validated;
  } catch (err) {
    console.error('[NetworkSuggester] Failed:', err);
    // Return basic suggestions on failure
    return topCompanies.slice(0, 3).map(c => ({
      company: c.name,
      strategy: 'linkedin_connect' as const,
      suggestedMessage: `Hi! I recently applied for the ${c.jobTitle} role at ${c.name} and would love to connect. My background in ${input.userProfile.skills.slice(0, 3).join(', ')} aligns well with this position.`,
      targetRole: 'Recruiter',
      priority: c.matchScore >= 80 ? 'high' as const : 'medium' as const,
      reason: 'LinkedIn connection with recruiter increases response rate',
    }));
  }
}
