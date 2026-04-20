/**
 * Tool-specific JSON-LD schema helpers.
 *
 * Generates SoftwareApplication + HowTo + FAQPage schema for each tool page.
 * Used by tool layouts to inject structured data for rich search results.
 */

interface ToolSchemaInput {
  name: string;
  description: string;
  url: string; // Full URL, e.g. https://3box.ai/tools/ats-checker
  image?: string; // OG image
  howToSteps?: { name: string; text: string }[];
  faqs?: { question: string; answer: string }[];
}

/** SoftwareApplication sub-schema for a specific tool. */
export function toolSoftwareAppSchema(input: ToolSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to use',
    },
    isPartOf: {
      '@type': 'SoftwareApplication',
      name: '3BOX AI',
      url: 'https://3box.ai',
    },
  };
}

/** HowTo schema — shows step-by-step in Google results. */
export function toolHowToSchema(input: ToolSchemaInput) {
  if (!input.howToSteps || input.howToSteps.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${input.name}`,
    description: input.description,
    step: input.howToSteps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/** FAQPage schema — shows FAQ rich results in Google. */
export function toolFaqSchema(input: ToolSchemaInput) {
  if (!input.faqs || input.faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: input.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** Build all schemas for a tool at once, filtering out nulls. */
export function buildToolSchemas(input: ToolSchemaInput): Record<string, any>[] {
  return [
    toolSoftwareAppSchema(input),
    toolHowToSchema(input),
    toolFaqSchema(input),
  ].filter(Boolean) as Record<string, any>[];
}

// ─── Pre-defined schemas for the 6 most-visited tools ──────

export const ATS_CHECKER_SCHEMA: ToolSchemaInput = {
  name: 'Free ATS Resume Checker',
  description: 'Instantly scan your resume against Applicant Tracking Systems (ATS) used by companies. Get a score, keyword analysis, and actionable fixes.',
  url: 'https://3box.ai/tools/ats-checker',
  howToSteps: [
    { name: 'Upload your resume', text: 'Paste resume text or upload a PDF/DOCX file.' },
    { name: 'Add the job description', text: 'Paste the target job posting to match keywords.' },
    { name: 'Get your ATS score', text: 'See keyword matches, formatting issues, and a compatibility score.' },
    { name: 'Apply the fixes', text: 'Use the suggestions to rewrite bullets, add missing skills, and fix layout.' },
  ],
  faqs: [
    { question: 'Is the ATS checker really free?', answer: 'Yes. No signup, no credit card. Scan as many resumes as you want on the free plan.' },
    { question: 'What ATS systems does it check against?', answer: 'We simulate common ATS parsers including Workday, Greenhouse, Lever, iCIMS, Taleo, and Naukri. The core checks (keyword matching, parse-friendliness, format) apply to 95%+ of ATS tools.' },
    { question: 'How accurate is the ATS score?', answer: 'The score reflects how well your resume matches the job description on keywords, skills, and formatting. An 80%+ score typically passes most ATS filters. We can\'t guarantee every individual company\'s ATS configuration.' },
    { question: 'Will AI rewrite my resume for me?', answer: 'The free checker gives you a score and suggestions. To auto-rewrite and optimize, use our AI resume builder (also free).' },
    { question: 'Is my resume data private?', answer: 'Yes. We do not share your resume with third parties. You can delete your data anytime from Settings.' },
  ],
};

export const RESUME_BUILDER_SCHEMA: ToolSchemaInput = {
  name: 'Free AI Resume Builder',
  description: 'Build an ATS-optimized resume with AI in minutes. Free templates, live ATS score, and one-click export to PDF.',
  url: 'https://3box.ai/tools/resume-builder',
  howToSteps: [
    { name: 'Pick a template', text: 'Choose from ATS-friendly templates optimized for modern recruiters.' },
    { name: 'Fill in your details', text: 'Paste your work history or upload an old resume to pre-fill.' },
    { name: 'Let AI enhance', text: 'AI rewrites bullets with action verbs and quantified impact.' },
    { name: 'Export to PDF', text: 'Download a perfectly-formatted PDF ready to submit anywhere.' },
  ],
  faqs: [
    { question: 'Is the AI resume builder free?', answer: 'Yes. Full AI resume generation, ATS check, and PDF export are included on the free plan.' },
    { question: 'Does it work with Naukri and LinkedIn?', answer: 'Yes. Resumes are formatted for ATS used by LinkedIn, Naukri, Indeed, Workday, Greenhouse, and most company portals.' },
    { question: 'Can I edit the AI-generated content?', answer: 'Absolutely. AI output is a starting point — every section is fully editable.' },
    { question: 'Are the templates ATS-friendly?', answer: 'Yes. All templates use single-column layouts, standard fonts, and proper section headings that ATS parsers read correctly.' },
    { question: 'What if I don\'t have a resume yet?', answer: 'You can start from scratch. The builder walks you through work history, skills, education, and projects step-by-step.' },
  ],
};

export const COVER_LETTER_SCHEMA: ToolSchemaInput = {
  name: 'Free AI Cover Letter Generator',
  description: 'Generate a tailored cover letter for any job in seconds. AI analyzes the job description and writes a personalized letter.',
  url: 'https://3box.ai/tools/cover-letter-generator',
  howToSteps: [
    { name: 'Paste the job description', text: 'Copy any job posting from LinkedIn, Indeed, or a company career page.' },
    { name: 'Add your background', text: 'Paste your resume or fill in your skills and experience.' },
    { name: 'Generate and tweak', text: 'AI writes a unique cover letter tailored to the job. Edit the tone and length.' },
    { name: 'Copy and send', text: 'Copy the final letter or download it as a PDF.' },
  ],
  faqs: [
    { question: 'Is the cover letter generator free?', answer: 'Yes. Unlimited cover letter generation on the free plan.' },
    { question: 'How does the AI tailor the letter?', answer: 'The AI reads the job description and your resume, then matches your experience to the specific requirements — highlighting the most relevant achievements.' },
    { question: 'Will HR detect AI-written cover letters?', answer: 'Our AI generates human-sounding, specific content. It avoids generic AI phrases and uses your real achievements. We recommend reviewing and personalizing before sending.' },
    { question: 'Can I use it for multiple applications?', answer: 'Yes. Generate a new cover letter for every job. Each one is uniquely tailored.' },
  ],
};

export const INTERVIEW_PREP_SCHEMA: ToolSchemaInput = {
  name: 'Free AI Interview Question Generator',
  description: 'Generate likely interview questions for any role or job description. Practice with AI feedback.',
  url: 'https://3box.ai/tools/interview-question-prep',
  howToSteps: [
    { name: 'Paste the job or role', text: 'Add the job description or just the role title.' },
    { name: 'Get likely questions', text: 'AI generates behavioral, technical, and situational questions for that role.' },
    { name: 'Practice answering', text: 'Get AI feedback on your answer structure, clarity, and impact.' },
    { name: 'Refine for the interview', text: 'Use the question bank to prep for the real thing.' },
  ],
  faqs: [
    { question: 'How does it know what questions will be asked?', answer: 'AI is trained on thousands of interview transcripts and job descriptions. It predicts common questions asked for your role, seniority, and company type.' },
    { question: 'Does it cover technical interviews?', answer: 'Yes. For engineering, data, product, and design roles we generate coding questions, system design prompts, and case study questions.' },
    { question: 'Is it free?', answer: 'Free plan includes interview prep for any role. No limits.' },
    { question: 'Can I practice for specific companies?', answer: 'Yes — enter the company name and role, and the AI tailors questions based on that company\'s interview patterns.' },
  ],
};

export const COLD_EMAIL_SCHEMA: ToolSchemaInput = {
  name: 'Free AI Cold Email Generator',
  description: 'Write personalized cold emails to recruiters, hiring managers, and potential referrers. AI crafts emails that get replies.',
  url: 'https://3box.ai/tools/cold-email-generator',
  howToSteps: [
    { name: 'Add your target', text: 'Enter who you\'re emailing — recruiter, hiring manager, or alumni — and their company.' },
    { name: 'Describe your goal', text: 'Are you asking for a referral, info interview, or direct application?' },
    { name: 'Generate the email', text: 'AI writes a short, personalized email with a clear ask.' },
    { name: 'Follow up', text: 'Get 2-3 follow-up message templates if no reply in 5 days.' },
  ],
  faqs: [
    { question: 'Do cold emails actually work for job search?', answer: 'Yes. Personalized cold emails to hiring managers and recruiters have 5-10x higher response rates than submitting through ATS portals alone.' },
    { question: 'Is it free?', answer: 'Yes. Unlimited email generation on free plan.' },
    { question: 'Can I send follow-ups automatically?', answer: 'On PRO/MAX plans, connect your Gmail/Outlook and let our Archer agent send and track follow-ups automatically.' },
  ],
};

export const SKILLS_GAP_SCHEMA: ToolSchemaInput = {
  name: 'Free Skills Gap Finder',
  description: 'Discover which skills you need to land your target role. AI compares your resume against real job postings.',
  url: 'https://3box.ai/tools/skills-gap-finder',
  howToSteps: [
    { name: 'Add your current role', text: 'Paste your resume or describe your current skills.' },
    { name: 'Pick your target role', text: 'Enter the role or job title you want next.' },
    { name: 'See your gaps', text: 'AI shows which skills are missing and how common they are in job postings.' },
    { name: 'Get a learning plan', text: 'Receive recommended courses, projects, and certifications to close each gap.' },
  ],
  faqs: [
    { question: 'How does the gap analysis work?', answer: 'We compare your resume skills against hundreds of live job postings for your target role. The more postings mention a skill you don\'t have, the bigger the gap.' },
    { question: 'Will it suggest specific courses?', answer: 'Yes — free and paid courses for each skill gap, prioritized by ROI and time investment.' },
    { question: 'Is this free?', answer: 'Yes. Full gap analysis and learning recommendations on the free plan.' },
  ],
};
