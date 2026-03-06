/**
 * Multi-source salary aggregation.
 *
 * Combines static BLS benchmark data, cost-of-living adjustments,
 * and AI-powered market analysis to produce comprehensive salary estimates.
 *
 * This function never throws — it always returns a result, falling back
 * gracefully through benchmark data, AI analysis, and finally static defaults.
 */

import { findClosestBenchmark, type SalaryBenchmark } from './salaryBenchmarks';
import { adjustSalaryForLocation, getCostOfLiving } from './costOfLiving';
import { aiChat, AI_MODELS, extractJSON } from '@/lib/ai/openrouter';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AggregatedSalaryEstimate {
  low: number;
  median: number;
  high: number;
  currency: string;
  factors: string[];
  marketTrend: 'growing' | 'stable' | 'declining';
  demandLevel: 'high' | 'medium' | 'low';
  dataSources: string[];
}

// ─── Experience Multipliers ───────────────────────────────────────────────────

const EXPERIENCE_MULTIPLIERS: Record<string, number> = {
  '0-1 years': 0.65,
  '1-3 years': 0.80,
  '3-5 years': 1.0,
  '5-10 years': 1.30,
  '10+ years': 1.60,
};

/**
 * Resolve experience string to a multiplier.
 * Handles exact keys and loose matching (e.g., "2 years" -> 1-3 years).
 */
function getExperienceMultiplier(experience: string): number {
  // Direct key match
  if (EXPERIENCE_MULTIPLIERS[experience] !== undefined) {
    return EXPERIENCE_MULTIPLIERS[experience];
  }

  // Try to extract a number from the experience string
  const normalized = experience.toLowerCase().trim();
  const numMatch = normalized.match(/(\d+)/);
  if (numMatch) {
    const years = parseInt(numMatch[1], 10);
    if (years <= 1) return EXPERIENCE_MULTIPLIERS['0-1 years'];
    if (years <= 3) return EXPERIENCE_MULTIPLIERS['1-3 years'];
    if (years <= 5) return EXPERIENCE_MULTIPLIERS['3-5 years'];
    if (years <= 10) return EXPERIENCE_MULTIPLIERS['5-10 years'];
    return EXPERIENCE_MULTIPLIERS['10+ years'];
  }

  // Check for keywords
  if (normalized.includes('entry') || normalized.includes('junior') || normalized.includes('intern') || normalized.includes('fresh') || normalized.includes('graduate')) {
    return EXPERIENCE_MULTIPLIERS['0-1 years'];
  }
  if (normalized.includes('mid') || normalized.includes('intermediate')) {
    return EXPERIENCE_MULTIPLIERS['3-5 years'];
  }
  if (normalized.includes('senior') || normalized.includes('lead') || normalized.includes('principal')) {
    return EXPERIENCE_MULTIPLIERS['5-10 years'];
  }
  if (normalized.includes('staff') || normalized.includes('director') || normalized.includes('executive') || normalized.includes('vp') || normalized.includes('chief')) {
    return EXPERIENCE_MULTIPLIERS['10+ years'];
  }

  // Default: mid-level
  return 1.0;
}

/**
 * Determine market trend from growth rate.
 */
function growthToTrend(growthRate: number): 'growing' | 'stable' | 'declining' {
  if (growthRate >= 0.10) return 'growing';
  if (growthRate >= 0.03) return 'stable';
  return 'declining';
}

/**
 * Determine demand level from growth rate.
 */
function growthToDemand(growthRate: number): 'high' | 'medium' | 'low' {
  if (growthRate >= 0.15) return 'high';
  if (growthRate >= 0.06) return 'medium';
  return 'low';
}

/**
 * Build factors list from benchmark and parameters.
 */
function buildFactors(
  benchmark: SalaryBenchmark,
  experience: string,
  location: string,
  colIndex: number,
  skills?: string[]
): string[] {
  const factors: string[] = [];

  factors.push(`Based on BLS OES 2024 data for "${benchmark.title}" (SOC ${benchmark.socCode || 'N/A'})`);
  factors.push(`Experience level: ${experience} (multiplier: ${getExperienceMultiplier(experience).toFixed(2)}x)`);

  if (colIndex !== 1.0) {
    const direction = colIndex > 1.0 ? 'higher' : 'lower';
    const pct = Math.abs(Math.round((colIndex - 1.0) * 100));
    factors.push(`Location adjustment for ${location}: ${pct}% ${direction} than US average (COL index: ${colIndex.toFixed(2)})`);
  } else {
    factors.push(`Location: ${location} (using US average baseline)`);
  }

  if (benchmark.growthRate >= 0.15) {
    factors.push(`High-growth field: ${Math.round(benchmark.growthRate * 100)}% projected annual growth`);
  } else if (benchmark.growthRate >= 0.08) {
    factors.push(`Moderate growth: ${Math.round(benchmark.growthRate * 100)}% projected annual growth`);
  }

  if (skills && skills.length > 0) {
    factors.push(`Skills considered: ${skills.join(', ')}`);
  }

  return factors;
}

/**
 * Attempt to get AI-enhanced market analysis.
 * Returns parsed AI insights or null on failure.
 */
async function getAIMarketAnalysis(
  role: string,
  location: string,
  experience: string,
  skills: string[],
  benchmark: SalaryBenchmark | null,
  colIndex: number
): Promise<{
  marketTrend?: 'growing' | 'stable' | 'declining';
  demandLevel?: 'high' | 'medium' | 'low';
  additionalFactors?: string[];
} | null> {
  try {
    const benchmarkContext = benchmark
      ? `Based on BLS data, the national median for "${benchmark.title}" is $${benchmark.medianUSD.toLocaleString()}, with a range of $${benchmark.p10USD.toLocaleString()} (10th percentile) to $${benchmark.p90USD.toLocaleString()} (90th percentile). Projected growth rate: ${Math.round(benchmark.growthRate * 100)}%.`
      : `No exact BLS benchmark was found for "${role}". Please estimate based on similar roles.`;

    const colContext = colIndex !== 1.0
      ? `The user is in ${location} (COL index: ${colIndex.toFixed(2)} relative to US average).`
      : `The user is in ${location} (using US average cost of living).`;

    const skillsContext = skills.length > 0
      ? `Key skills: ${skills.join(', ')}.`
      : '';

    const prompt = `${benchmarkContext} ${colContext} With ${experience} experience. ${skillsContext}

Provide additional market context for this role. Return ONLY valid JSON with this exact structure:
{
  "marketTrend": "growing" | "stable" | "declining",
  "demandLevel": "high" | "medium" | "low",
  "additionalFactors": ["factor1", "factor2", "factor3"]
}

The additionalFactors should include 2-4 brief insights about:
- Current market demand for this role
- Impact of specific skills on compensation
- Industry trends affecting salary
- Remote work impact if applicable

Return ONLY the JSON object, no markdown or explanation.`;

    const response = await aiChat({
      messages: [
        {
          role: 'system',
          content: 'You are a compensation data analyst. Provide concise, data-driven market insights. Always return valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      model: AI_MODELS.free.id,
      temperature: 0.4,
      maxTokens: 512,
      jsonMode: false,
    });

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    // Validate the parsed structure
    const validTrends = ['growing', 'stable', 'declining'];
    const validDemand = ['high', 'medium', 'low'];

    return {
      marketTrend: validTrends.includes(parsed.marketTrend) ? parsed.marketTrend : undefined,
      demandLevel: validDemand.includes(parsed.demandLevel) ? parsed.demandLevel : undefined,
      additionalFactors: Array.isArray(parsed.additionalFactors)
        ? parsed.additionalFactors.filter((f: unknown) => typeof f === 'string').slice(0, 5)
        : undefined,
    };
  } catch {
    // AI failed — this is fine, we proceed without it
    return null;
  }
}

/**
 * Attempt pure AI salary estimation when no benchmark is found.
 * Returns a partial estimate or null on failure.
 */
async function getAISalaryEstimation(
  role: string,
  location: string,
  experience: string,
  skills: string[]
): Promise<{
  low: number;
  median: number;
  high: number;
  currency: string;
  marketTrend: 'growing' | 'stable' | 'declining';
  demandLevel: 'high' | 'medium' | 'low';
  factors: string[];
} | null> {
  try {
    const skillsContext = skills.length > 0 ? `Key skills: ${skills.join(', ')}.` : '';

    const prompt = `Estimate the annual salary range for a "${role}" with ${experience} experience located in ${location}. ${skillsContext}

Return ONLY valid JSON with this exact structure:
{
  "low": <number in USD>,
  "median": <number in USD>,
  "high": <number in USD>,
  "currency": "<3-letter currency code for the location>",
  "marketTrend": "growing" | "stable" | "declining",
  "demandLevel": "high" | "medium" | "low",
  "factors": ["insight1", "insight2", "insight3"]
}

Use realistic, current market data. Amounts should be in the local currency for the given location. Include 2-4 brief factors explaining the estimate.
Return ONLY the JSON object.`;

    const response = await aiChat({
      messages: [
        {
          role: 'system',
          content: 'You are a compensation data analyst with expertise in global salary benchmarking. Provide realistic salary estimates based on current market data. Always return valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      model: AI_MODELS.free.id,
      temperature: 0.4,
      maxTokens: 512,
      jsonMode: false,
    });

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    // Validate required numeric fields
    if (typeof parsed.low !== 'number' || typeof parsed.median !== 'number' || typeof parsed.high !== 'number') {
      return null;
    }

    const validTrends = ['growing', 'stable', 'declining'];
    const validDemand = ['high', 'medium', 'low'];

    return {
      low: Math.round(parsed.low),
      median: Math.round(parsed.median),
      high: Math.round(parsed.high),
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'USD',
      marketTrend: validTrends.includes(parsed.marketTrend) ? parsed.marketTrend : 'stable',
      demandLevel: validDemand.includes(parsed.demandLevel) ? parsed.demandLevel : 'medium',
      factors: Array.isArray(parsed.factors)
        ? parsed.factors.filter((f: unknown) => typeof f === 'string').slice(0, 5)
        : [`AI-estimated salary range for "${role}" in ${location}`],
    };
  } catch {
    return null;
  }
}

/**
 * Generate static fallback defaults based only on experience level.
 * Used as the absolute last resort when both benchmarks and AI fail.
 */
function getStaticFallback(
  role: string,
  location: string,
  experience: string
): AggregatedSalaryEstimate {
  const expMultiplier = getExperienceMultiplier(experience);

  // Conservative US baseline: $65k median for a generic role
  const baseMedian = 65_000;
  const median = Math.round(baseMedian * expMultiplier);
  const low = Math.round(median * 0.70);
  const high = Math.round(median * 1.50);

  // Apply COL adjustment if possible
  const colEntry = getCostOfLiving(location);
  const colIndex = colEntry ? colEntry.index : 1.0;
  const currency = colEntry ? colEntry.currency : 'USD';

  return {
    low: Math.round(low * colIndex),
    median: Math.round(median * colIndex),
    high: Math.round(high * colIndex),
    currency,
    factors: [
      `Estimated based on experience level: ${experience}`,
      `No specific benchmark data available for "${role}"`,
      colEntry
        ? `Location adjustment applied for ${location} (COL index: ${colIndex.toFixed(2)})`
        : `Using US average baseline for ${location}`,
      'For more accurate estimates, try a more specific job title',
    ],
    marketTrend: 'stable',
    demandLevel: 'medium',
    dataSources: ['Experience-based estimation', 'Cost of Living Index'],
  };
}

// ─── Main Aggregation Function ────────────────────────────────────────────────

/**
 * Get a comprehensive salary estimate by aggregating multiple data sources:
 *
 * 1. BLS Occupational Employment Statistics benchmarks (static)
 * 2. Cost-of-living adjustments (static)
 * 3. AI-powered market trend analysis (dynamic)
 *
 * This function never throws. It gracefully degrades through:
 *   benchmark + AI -> benchmark only -> AI only -> static defaults
 *
 * @param params.role - Job title to estimate salary for
 * @param params.location - City/region for cost-of-living adjustment
 * @param params.experience - Experience level (e.g., "3-5 years", "senior")
 * @param params.skills - Optional list of relevant skills
 * @returns Aggregated salary estimate with sources and market analysis
 */
export async function getAggregatedSalaryEstimate(params: {
  role: string;
  location: string;
  experience: string;
  skills?: string[];
}): Promise<AggregatedSalaryEstimate> {
  const { role, location, experience, skills = [] } = params;

  try {
    // Step 1: Find closest benchmark
    const benchmark = findClosestBenchmark(role);
    const expMultiplier = getExperienceMultiplier(experience);

    if (benchmark) {
      // ── Benchmark Found Path ──────────────────────────────────────────────

      // Calculate base salary range with experience multiplier
      const baseLow = Math.round(benchmark.p10USD * expMultiplier);
      const baseMedian = Math.round(benchmark.medianUSD * expMultiplier);
      const baseHigh = Math.round(benchmark.p90USD * expMultiplier);

      // Apply location adjustment
      const adjustedLow = adjustSalaryForLocation(baseLow, location);
      const adjustedMedian = adjustSalaryForLocation(baseMedian, location);
      const adjustedHigh = adjustSalaryForLocation(baseHigh, location);

      const currency = adjustedMedian.currency;
      const colIndex = adjustedMedian.colIndex;

      // Build factors from benchmark data
      const factors = buildFactors(benchmark, experience, location, colIndex, skills);

      // Default trend/demand from benchmark growth rate
      let marketTrend = growthToTrend(benchmark.growthRate);
      let demandLevel = growthToDemand(benchmark.growthRate);
      const dataSources: string[] = ['BLS Occupational Employment Statistics 2024', 'Cost of Living Index'];

      // Step 2: Enhance with AI market analysis
      const aiAnalysis = await getAIMarketAnalysis(
        role,
        location,
        experience,
        skills,
        benchmark,
        colIndex
      );

      if (aiAnalysis) {
        // Override trend/demand with AI analysis if provided
        if (aiAnalysis.marketTrend) marketTrend = aiAnalysis.marketTrend;
        if (aiAnalysis.demandLevel) demandLevel = aiAnalysis.demandLevel;

        // Append AI-generated factors
        if (aiAnalysis.additionalFactors && aiAnalysis.additionalFactors.length > 0) {
          factors.push(...aiAnalysis.additionalFactors);
        }

        dataSources.push('AI Market Analysis');
      }

      return {
        low: adjustedLow.adjustedAmount,
        median: adjustedMedian.adjustedAmount,
        high: adjustedHigh.adjustedAmount,
        currency,
        factors,
        marketTrend,
        demandLevel,
        dataSources,
      };
    }

    // ── No Benchmark Found: Try Pure AI Estimation ──────────────────────────

    const aiEstimate = await getAISalaryEstimation(role, location, experience, skills);

    if (aiEstimate) {
      return {
        low: aiEstimate.low,
        median: aiEstimate.median,
        high: aiEstimate.high,
        currency: aiEstimate.currency,
        factors: [
          `AI-estimated salary for "${role}" with ${experience} experience in ${location}`,
          ...aiEstimate.factors,
          ...(skills.length > 0 ? [`Skills considered: ${skills.join(', ')}`] : []),
        ],
        marketTrend: aiEstimate.marketTrend,
        demandLevel: aiEstimate.demandLevel,
        dataSources: ['AI Salary Estimation', 'Cost of Living Index'],
      };
    }

    // ── Absolute Fallback: Static Defaults ──────────────────────────────────
    return getStaticFallback(role, location, experience);
  } catch {
    // Catch-all: ensure we never throw
    return getStaticFallback(role, location, experience);
  }
}
