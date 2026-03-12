/**
 * Tool-specific loading tips displayed during AI processing.
 * Each tool has 5-8 engaging tips that rotate every 3 seconds.
 */

export const LOADING_TIPS: Record<string, string[]> = {
  'ats-checker': [
    'Scanning your resume against ATS parsing algorithms...',
    'Checking keyword density and placement across sections...',
    'Analyzing formatting compatibility with Workday, Taleo, and iCIMS...',
    'Evaluating section ordering and header standardization...',
    'Checking date format consistency throughout your resume...',
    'Verifying contact information completeness and format...',
    'Scoring quantified achievements and action verb usage...',
  ],
  'cold-email-generator': [
    'Crafting a personalized subject line for maximum open rate...',
    'Applying the AIDA framework to your outreach message...',
    'Optimizing send timing based on recruiter behavior patterns...',
    'Adding personalization hooks based on the target company...',
    'Checking spam trigger words and email deliverability...',
    'Designing a 3-touch follow-up sequence...',
  ],
  'cover-letter-generator': [
    'Analyzing the job description for key requirements...',
    'Matching your experience to the top skills in the posting...',
    'Crafting a personalized opening hook...',
    'Optimizing keywords for ATS compatibility...',
    'Structuring the letter with the Challenge-Action-Result framework...',
    'Calibrating tone and formality for the industry...',
  ],
  'interview-question-prep': [
    'Analyzing the role for likely interview question patterns...',
    'Generating behavioral questions using the STAR method framework...',
    'Creating technical questions matched to the job requirements...',
    'Preparing situational scenarios relevant to the company...',
    'Calibrating difficulty level based on the role seniority...',
    'Adding company-specific preparation notes...',
  ],
  'linkedin-post-generator': [
    'Crafting a hook that stops the scroll in the first 2 lines...',
    'Optimizing for LinkedIn algorithm — dwell time and engagement...',
    'Structuring the post for maximum readability on mobile...',
    'Selecting hashtags with the perfect reach-to-competition ratio...',
    'Adding a call-to-action that drives meaningful engagement...',
    'Targeting the 1300-1500 character sweet spot for visibility...',
  ],
  'linkedin-headline-generator': [
    'Analyzing recruiter search patterns for your industry...',
    'Optimizing the first 60 characters for search visibility...',
    'Balancing keywords with compelling personal branding...',
    'Testing headline formula templates for maximum impact...',
    'Ensuring compatibility with LinkedIn search algorithms...',
  ],
  'linkedin-hashtag-generator': [
    'Analyzing hashtag volume and competition data...',
    'Building a 3-layer strategy — broad, niche, and trending...',
    'Selecting the optimal 3-5 hashtags for maximum reach...',
    'Cross-referencing with your industry content pillars...',
    'Checking trending topics in your professional network...',
  ],
  'linkedin-recommendation-generator': [
    'Analyzing the professional relationship context...',
    'Crafting specific, authentic praise with concrete examples...',
    'Balancing professional endorsement with personal warmth...',
    'Optimizing length for readability — targeting 3-5 impactful sentences...',
    'Adding credibility markers that strengthen your recommendation...',
  ],
  'resume-generator': [
    'Building an ATS-optimized resume structure...',
    'Crafting impact-driven bullet points with the PAR formula...',
    'Optimizing keyword density for applicant tracking systems...',
    'Ordering sections for maximum recruiter impact...',
    'Formatting for compatibility with Workday and Taleo...',
    'Adding quantified achievements to strengthen each bullet...',
  ],
  'resume-score': [
    'Evaluating your resume against the 15-point scoring rubric...',
    'Analyzing recruiter eye-tracking patterns — the 7.4-second F-scan...',
    'Checking ATS compatibility across 5 major platforms...',
    'Measuring keyword match against industry benchmarks...',
    'Scoring achievement quantification and action verb usage...',
    'Generating personalized improvement recommendations...',
  ],
  'resume-summary-generator': [
    'Analyzing your career arc for the strongest positioning angle...',
    'Front-loading high-impact keywords for ATS matching...',
    'Crafting a value proposition that hooks recruiters in 3 seconds...',
    'Adapting tone and format for your career stage...',
    'Balancing personality with professional credibility...',
  ],
  'job-description-analyzer': [
    'Parsing the job description for explicit and hidden requirements...',
    'Detecting compensation clues and work-life indicators...',
    'Analyzing required vs preferred qualifications...',
    'Identifying red flags and culture fit signals...',
    'Mapping skill requirements to your experience...',
    'Checking for unrealistic expectations or scope creep...',
  ],
  'skills-gap-finder': [
    'Matching your skills against the target role requirements...',
    'Classifying gaps as critical, important, or nice-to-have...',
    'Analyzing transferable skills that bridge the gap...',
    'Estimating learning time for each missing skill...',
    'Recommending the fastest certification path for key gaps...',
    'Calculating your overall readiness score...',
  ],
  'elevator-pitch-generator': [
    'Structuring your pitch with the Problem-Solution-Impact framework...',
    'Calibrating to the 75-word sweet spot — exactly 30 seconds...',
    'Adapting language for your target audience...',
    'Adding a memorable hook that starts the conversation...',
    'Ensuring confidence language without arrogance...',
  ],
  'thank-you-email-generator': [
    'Crafting a thank-you that reinforces your candidacy...',
    'Referencing specific discussion points from the interview...',
    'Applying the reinforce-not-repeat strategy...',
    'Optimizing timing — sending within the critical 2-4 hour window...',
    'Adding a forward-looking statement to maintain momentum...',
  ],
};

/**
 * Get loading tips for a specific tool.
 * Falls back to generic tips if tool not found.
 */
export function getLoadingTips(toolSlug: string): string[] {
  return LOADING_TIPS[toolSlug] || [
    'Analyzing your input with AI...',
    'Processing your request...',
    'Generating personalized results...',
    'Almost there — finalizing your output...',
    'Applying industry best practices to your content...',
  ];
}
