/**
 * Static content for agent detail pages — stories, case studies, features.
 */

export interface AgentPageContent {
  slug: string;
  name: string;
  displayName: string;
  tagline: string;
  role: string;
  heroDescription: string;
  origin: string;
  gradient: string;
  colorHex: string;
  features: { title: string; description: string }[];
  howItWorks: { step: string; title: string; description: string }[];
  caseStudies: { title: string; industry: string; challenge: string; solution: string; result: string }[];
  stats: { label: string; value: string }[];
}

export const AGENT_PAGES: Record<string, AgentPageContent> = {
  cortex: {
    slug: 'cortex',
    name: 'Cortex',
    displayName: 'Agent Cortex',
    tagline: 'The AI Coordinator That Never Sleeps',
    role: 'AI Coordinator',
    heroDescription: 'Agent Cortex is the brain of your jobTED AI agent team. It coordinates all 6 specialist agents, decides what to run and when, and orchestrates your entire job search pipeline from a single command.',
    origin: 'Agent Cortex was born from a simple observation: job seekers waste hours switching between tools — resume builders, job boards, email templates, interview prep. Each tool works in isolation. What if one AI brain could coordinate everything? Cortex was designed as the central nervous system — a coordinator that understands your career goals and deploys the right agent at the right time. When you tell Cortex your dream role, it activates Scout to find jobs, Forge to optimize your resume, Archer to send applications, Atlas to prep interviews, Sage to upskill you, and Sentinel to quality-check everything. One command, six agents, zero micromanagement.',
    gradient: 'from-cyan-500/20 to-purple-500/20',
    colorHex: '#00d4ff',
    features: [
      { title: 'Single Command Activation', description: 'Tell Cortex your goal once. It deploys all 6 agents with the right instructions and priorities automatically.' },
      { title: 'Agent Orchestration', description: 'Cortex decides the optimal sequence — Scout finds jobs first, Forge optimizes resume next, then Archer applies. No wasted effort.' },
      { title: 'Three Automation Modes', description: 'Copilot (you approve), Autopilot (rules-based), or Full Agent (fully autonomous). Switch anytime based on your comfort level.' },
      { title: 'Daily Briefings', description: 'Every morning, Cortex summarizes what happened overnight — jobs found, applications sent, interviews scheduled.' },
      { title: 'Priority Management', description: 'Cortex knows which jobs to prioritize based on match score, deadline, and your preferences.' },
      { title: 'Cross-Agent Intelligence', description: 'Insights from one agent feed into others. Sentinel feedback improves Forge output. Scout data informs Atlas prep.' },
    ],
    howItWorks: [
      { step: '01', title: 'Set Your Career Goals', description: 'Tell Cortex your target role, preferred locations, salary expectations, and deal-breakers. This becomes the master brief for all agents.' },
      { step: '02', title: 'Agent Deployment', description: 'Cortex activates the right agents in the right order. Scout starts searching, Forge begins optimizing, and the pipeline kicks in.' },
      { step: '03', title: 'Continuous Orchestration', description: 'As new jobs appear, Cortex routes them through the pipeline — optimize, review, apply — without any manual intervention.' },
      { step: '04', title: 'Results & Reporting', description: 'Check your dashboard for real-time updates. Cortex delivers daily summaries and flags items that need your attention.' },
    ],
    caseStudies: [
      { title: 'From Overwhelmed to Organized', industry: 'Tech', challenge: 'A software engineer was applying to 50+ jobs manually, losing track of applications and missing deadlines.', solution: 'Cortex coordinated all 6 agents in Full Agent mode — Scout found matching jobs, Forge created per-job resumes, Archer applied automatically, and Atlas prepped interview materials for callbacks.', result: 'Received 12 interview invitations in 3 weeks with zero manual applications. Hired at a Series B startup.' },
      { title: 'Career Change on Autopilot', industry: 'Finance → Tech', challenge: 'A financial analyst wanted to transition to product management but had no idea where to start across different job boards.', solution: 'Cortex ran in Copilot mode — Scout identified PM roles that valued analytical skills, Sage built a learning path for missing skills, and Forge highlighted transferable experience.', result: 'Landed an Associate PM role within 6 weeks. The coordinated approach made the career switch feel seamless.' },
    ],
    stats: [
      { label: 'Agents Coordinated', value: '6' },
      { label: 'Automation Modes', value: '3' },
      { label: 'Avg. Time Saved Weekly', value: '15 hrs' },
      { label: 'Pipeline Efficiency', value: '94%' },
    ],
  },

  scout: {
    slug: 'scout',
    name: 'Scout',
    displayName: 'Agent Scout',
    tagline: 'Your Tireless Job Hunter Across the Web',
    role: 'Job Hunter',
    heroDescription: 'Agent Scout scans 6+ job sources 24/7 to find opportunities that match your profile. It scores each job against your skills, experience, and preferences — so you never miss a perfect match.',
    origin: 'Scout was created because the biggest pain point in job searching is the search itself. Job seekers spend 2-3 hours daily scrolling through LinkedIn, Indeed, Naukri, Glassdoor, and company career pages — often seeing the same listings or missing relevant ones. Scout was built to be an always-on radar. It aggregates listings from multiple sources, deduplicates them, and scores every opportunity against your unique profile. High-match jobs get flagged immediately. Low-quality spam gets filtered out. You wake up to a curated list of opportunities, not an overwhelming feed.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    colorHex: '#60a5fa',
    features: [
      { title: 'Multi-Source Scanning', description: 'Monitors LinkedIn, Indeed, Naukri, Glassdoor, Google Jobs, and company career pages simultaneously.' },
      { title: 'Smart Match Scoring', description: 'Each job gets a 0-100 match score based on your skills, experience level, location, and salary expectations.' },
      { title: 'Deduplication Engine', description: 'The same job posted on 3 platforms? Scout shows it once with all source links.' },
      { title: 'Exclusion Rules', description: 'Block specific companies, locations, or keywords. Scout respects your deal-breakers.' },
      { title: 'Real-Time Alerts', description: 'Get notified instantly when a high-match job appears. First to apply often means first to interview.' },
      { title: 'Market Intelligence', description: 'Scout tracks hiring trends, salary ranges, and demand patterns for your target role.' },
    ],
    howItWorks: [
      { step: '01', title: 'Profile Setup', description: 'Scout reads your career profile — target role, skills, preferred locations, salary range, and any exclusion rules.' },
      { step: '02', title: 'Continuous Scanning', description: 'Every few hours, Scout queries job boards, company pages, and aggregators for new listings matching your criteria.' },
      { step: '03', title: 'Scoring & Ranking', description: 'Each discovered job gets analyzed against your profile. Skills match, experience fit, location, and salary are all factored in.' },
      { step: '04', title: 'Curated Feed', description: 'Results appear in your dashboard sorted by match score. High-confidence matches are forwarded to Forge and Archer automatically.' },
    ],
    caseStudies: [
      { title: 'Hidden Gem Discovery', industry: 'Healthcare', challenge: 'A registered nurse was only searching on one job board and missing hospital-specific career pages in her city.', solution: 'Scout expanded the search to 6 sources including direct hospital career portals. It found 3x more relevant listings within the first week.', result: 'Found a specialized pediatric nursing role on a hospital career page that was never cross-posted to major boards. Hired within 2 weeks.' },
      { title: 'The Remote Work Filter', industry: 'Marketing', challenge: 'A marketing manager wanted fully remote roles but most listings used inconsistent remote work labels across platforms.', solution: 'Scout used smart keyword analysis across multiple platforms to identify truly remote roles versus hybrid positions with misleading tags.', result: 'Discovered 40+ genuine remote marketing roles in the first scan cycle. Applied to 15 high-match positions through the agent pipeline.' },
    ],
    stats: [
      { label: 'Job Sources', value: '6+' },
      { label: 'Avg. Jobs Found Daily', value: '120+' },
      { label: 'Match Accuracy', value: '89%' },
      { label: 'Dedup Rate', value: '35%' },
    ],
  },

  forge: {
    slug: 'forge',
    name: 'Forge',
    displayName: 'Agent Forge',
    tagline: 'The Resume Optimizer That Beats Every ATS',
    role: 'Resume Optimizer',
    heroDescription: 'Agent Forge takes your base resume and creates optimized, job-specific variants that score 90%+ on ATS systems. It enhances keywords, improves bullet points, and ensures every application is tailored.',
    origin: 'Forge was born from a frustrating reality: most resumes never reach human eyes. Over 75% of applications are filtered out by ATS (Applicant Tracking Systems) before a recruiter sees them. Job seekers submit the same generic resume everywhere, and the system quietly rejects it. Forge changes that equation. It analyzes the target job description, identifies critical keywords and requirements, then creates a tailored resume variant that maximizes ATS compatibility while staying authentic. It does not fabricate — it highlights and reorganizes your real experience to match what each specific role demands.',
    gradient: 'from-orange-500/20 to-amber-500/20',
    colorHex: '#fb923c',
    features: [
      { title: 'ATS Keyword Optimization', description: 'Extracts keywords from job descriptions and naturally weaves them into your resume for maximum ATS score.' },
      { title: 'Per-Job Variants', description: 'Creates a uniquely tailored resume for every application. Same base experience, different emphasis and keywords.' },
      { title: 'Bullet Point Enhancement', description: 'Transforms weak descriptions into impact-driven, quantified achievement bullets that recruiters love.' },
      { title: 'Score Analysis', description: 'Shows your resume ATS compatibility score before and after optimization with detailed breakdown.' },
      { title: 'Section Reordering', description: 'Puts the most relevant sections first based on what each specific job prioritizes.' },
      { title: 'Format Preservation', description: 'Optimizes content while maintaining clean, professional formatting that works across all ATS platforms.' },
    ],
    howItWorks: [
      { step: '01', title: 'Resume Analysis', description: 'Forge reads your base resume and understands your experience, skills, education, and achievements.' },
      { step: '02', title: 'Job Description Parsing', description: 'When a job match comes from Scout, Forge extracts critical requirements, preferred keywords, and must-haves.' },
      { step: '03', title: 'Tailored Optimization', description: 'Forge creates a new resume variant — keywords added, bullets rewritten, sections reordered to match the role.' },
      { step: '04', title: 'Quality Check', description: 'The optimized resume is scored against the ATS and sent to Sentinel for a final quality review before submission.' },
    ],
    caseStudies: [
      { title: 'From 45% to 94% ATS Score', industry: 'Software Engineering', challenge: 'A senior developer had a great resume but kept getting auto-rejected. His original ATS score was 45%.', solution: 'Forge analyzed 10 target job descriptions, identified missing keywords like specific framework versions and methodology terms, and created optimized variants for each application.', result: 'ATS scores jumped to 90%+ across all variants. Received 8 interview invitations in the first 2 weeks after zero callbacks previously.' },
      { title: 'Career Changer Resume', industry: 'Teaching → UX Design', challenge: 'A teacher transitioning to UX design had no direct UX experience on her resume.', solution: 'Forge identified transferable skills (curriculum design → user research, student assessment → usability testing) and restructured the resume to highlight relevant capabilities.', result: 'Resume reframing led to 5 UX internship interviews. Hired as a Junior UX Designer at an edtech company.' },
    ],
    stats: [
      { label: 'Avg. ATS Score Improvement', value: '+47%' },
      { label: 'Resume Variants Created', value: '10K+' },
      { label: 'Keywords Optimized', value: '95%' },
      { label: 'Bullet Points Enhanced', value: '50K+' },
    ],
  },

  archer: {
    slug: 'archer',
    name: 'Archer',
    displayName: 'Agent Archer',
    tagline: 'Your Application Sniper — Never Miss a Target',
    role: 'Application Agent',
    heroDescription: 'Agent Archer generates tailored cover letters and sends job applications on your behalf. It applies through job portals, sends professional cold emails to HR departments, and tracks every submission.',
    origin: 'Archer was designed to solve the application bottleneck. Even after finding great jobs and optimizing resumes, most job seekers stall at the application step. Writing cover letters is tedious. Filling out portal forms is repetitive. Following up feels awkward. Archer automates the entire outreach process. It generates personalized cover letters that reference specific company details, submits applications through job portals, and can even send professional cold emails to hiring managers with your resume attached. Every application is tracked so you always know your pipeline status.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    colorHex: '#4ade80',
    features: [
      { title: 'AI Cover Letters', description: 'Generates unique, personalized cover letters for each application — referencing the company, role, and your matching experience.' },
      { title: 'Portal Applications', description: 'Fills and submits applications on major job portals automatically with your optimized resume and cover letter.' },
      { title: 'Cold Email Outreach', description: 'Sends professional emails to HR teams and hiring managers with your resume and a compelling introduction.' },
      { title: 'Application Tracking', description: 'Every sent application is logged with status tracking — submitted, viewed, responded, interview scheduled.' },
      { title: 'Follow-Up Sequences', description: 'Sends polite follow-up emails after 5-7 days if there is no response. Persistent but professional.' },
      { title: 'Send Schedule Optimization', description: 'Times application submissions for maximum visibility — typically Tuesday-Thursday mornings in the recruiter timezone.' },
    ],
    howItWorks: [
      { step: '01', title: 'Receive Optimized Package', description: 'Archer gets the job listing, optimized resume from Forge, and quality approval from Sentinel.' },
      { step: '02', title: 'Generate Cover Letter', description: 'A unique cover letter is created that connects your experience to the specific role and company.' },
      { step: '03', title: 'Submit Application', description: 'Archer applies through the job portal or sends a cold email to the hiring team with all materials attached.' },
      { step: '04', title: 'Track & Follow Up', description: 'The application is logged in your dashboard. If no response comes within a week, a follow-up is sent automatically.' },
    ],
    caseStudies: [
      { title: '200 Applications in 2 Weeks', industry: 'Data Science', challenge: 'A data scientist had 200+ matched jobs but was only managing to apply to 3-4 per day manually.', solution: 'Archer took over the application process — generating unique cover letters for each role and submitting applications in batches during optimal sending windows.', result: 'All 200 applications sent in 14 days. 24 interview callbacks. Multiple competing offers received within the month.' },
      { title: 'Cold Email Success Story', industry: 'Startup Ecosystem', challenge: 'A product manager wanted to reach startups that do not post on major job boards.', solution: 'Archer identified hiring managers at 50 target startups and sent personalized cold emails with the optimized resume and a role-specific pitch.', result: '18% response rate on cold emails. 3 interviews scheduled from companies that had no active job postings. Hired at a seed-stage company.' },
    ],
    stats: [
      { label: 'Cover Letters Generated', value: '25K+' },
      { label: 'Avg. Response Rate', value: '22%' },
      { label: 'Applications Sent', value: '100K+' },
      { label: 'Follow-Up Success', value: '15%' },
    ],
  },

  atlas: {
    slug: 'atlas',
    name: 'Atlas',
    displayName: 'Agent Atlas',
    tagline: 'Your Personal Interview Coach for Every Company',
    role: 'Interview Coach',
    heroDescription: 'Agent Atlas prepares you for interviews with company-specific questions, practice scenarios, and detailed feedback. It analyzes job descriptions and company culture to predict exactly what you will be asked.',
    origin: 'Atlas was created because interview preparation is where many qualified candidates fail. They have the skills, the experience, the optimized resume — but they walk into interviews unprepared for company-specific questions. Generic interview advice does not cut it anymore. Atlas researches each company you are interviewing with — their values, recent news, tech stack, culture — and generates highly specific practice questions. It simulates real interview scenarios and provides feedback on your responses. By the time you walk in, you have already rehearsed answers tailored to that exact company and role.',
    gradient: 'from-purple-500/20 to-violet-500/20',
    colorHex: '#c084fc',
    features: [
      { title: 'Company-Specific Questions', description: 'Generates interview questions based on the specific company culture, tech stack, and role requirements.' },
      { title: 'Practice Scenarios', description: 'Simulates realistic interview conversations with follow-up questions and curveballs.' },
      { title: 'JD-Based Prediction', description: 'Analyzes the job description to predict the most likely interview topics and technical assessments.' },
      { title: 'Response Feedback', description: 'Evaluates your practice answers and suggests improvements for clarity, impact, and relevance.' },
      { title: 'STAR Method Coaching', description: 'Helps you structure behavioral answers using the Situation-Task-Action-Result framework.' },
      { title: 'Company Research Brief', description: 'Provides a one-page brief on the company — recent news, funding, competitors, culture signals.' },
    ],
    howItWorks: [
      { step: '01', title: 'Interview Alert', description: 'When you schedule an interview (or Cortex detects one), Atlas activates and starts researching the company.' },
      { step: '02', title: 'Question Generation', description: 'Atlas analyzes the JD, company profile, and industry to generate 20+ likely interview questions.' },
      { step: '03', title: 'Practice Session', description: 'You practice answering questions in a simulated interview. Atlas provides real-time feedback and suggestions.' },
      { step: '04', title: 'Final Prep Brief', description: 'Before the interview, you receive a company research brief, top questions to prepare, and confidence-boosting tips.' },
    ],
    caseStudies: [
      { title: 'FAANG Interview Breakthrough', industry: 'Big Tech', challenge: 'A software engineer had failed 3 previous FAANG interviews despite strong technical skills — always stumbling on behavioral questions.', solution: 'Atlas generated 30 company-specific behavioral questions for Meta, coached STAR responses, and ran 5 simulated interview rounds with escalating difficulty.', result: 'Passed all 4 interview rounds at Meta. Atlas-predicted questions appeared in 3 out of 4 rounds. Received a Senior Engineer offer.' },
      { title: 'Startup Culture Fit', industry: 'Fintech', challenge: 'A banker transitioning to fintech kept getting rejected at the culture fit stage of startup interviews.', solution: 'Atlas researched 5 target startups, identified their cultural values, and coached responses that authentically connected banking experience with startup mentality.', result: 'Cleared culture fit rounds at 4 out of 5 startups. Joined a Series A fintech company as Head of Operations.' },
    ],
    stats: [
      { label: 'Questions Generated', value: '50K+' },
      { label: 'Practice Sessions', value: '8K+' },
      { label: 'Interview Pass Rate', value: '78%' },
      { label: 'Company Briefs Created', value: '12K+' },
    ],
  },

  sage: {
    slug: 'sage',
    name: 'Sage',
    displayName: 'Agent Sage',
    tagline: 'The Skill Trainer That Maps Your Growth Path',
    role: 'Skill Trainer',
    heroDescription: 'Agent Sage identifies the skills you are missing, creates personalized learning paths, recommends courses and projects, and tracks your skill growth over time. Close the gap between where you are and where top candidates stand.',
    origin: 'Sage was built because the best resume optimization cannot compensate for missing skills. When Scout finds high-match jobs that require skills you do not have yet, that is not a dead end — it is a growth opportunity. Sage analyzes the gap between your current skills and what the market demands. It creates personalized learning paths, recommends free and paid courses, suggests portfolio projects, and tracks your progress. Over time, Sage helps you become a genuinely stronger candidate, not just a better-looking one on paper.',
    gradient: 'from-teal-500/20 to-cyan-500/20',
    colorHex: '#2dd4bf',
    features: [
      { title: 'Skill Gap Analysis', description: 'Compares your profile against job requirements and market trends to identify exactly which skills you need.' },
      { title: 'Personalized Learning Paths', description: 'Creates step-by-step learning plans with estimated timelines based on your current level and learning speed.' },
      { title: 'Course Recommendations', description: 'Recommends specific courses from Coursera, Udemy, YouTube, and free resources matched to your gaps.' },
      { title: 'Project Suggestions', description: 'Proposes portfolio projects that demonstrate the skills employers are looking for in your target role.' },
      { title: 'Growth Tracking', description: 'Monitors your skill development over time and adjusts recommendations as you progress.' },
      { title: 'Market Trend Analysis', description: 'Identifies emerging skills in your field so you can stay ahead of the curve, not behind it.' },
    ],
    howItWorks: [
      { step: '01', title: 'Gap Identification', description: 'Sage compares your skills against requirements from top jobs in your target role. Missing skills are flagged.' },
      { step: '02', title: 'Priority Ranking', description: 'Skills are ranked by impact — which missing skill would unlock the most job opportunities?' },
      { step: '03', title: 'Learning Plan Creation', description: 'A personalized path is built with courses, tutorials, and projects. Estimated time to competency is provided.' },
      { step: '04', title: 'Progress & Adjustment', description: 'As you learn, Sage updates your profile and adjusts recommendations. New skills feed back into Scout and Forge.' },
    ],
    caseStudies: [
      { title: 'The Missing Skill That Changed Everything', industry: 'Data Analytics', challenge: 'A business analyst kept seeing SQL as a requirement in 80% of target jobs but only had basic spreadsheet skills.', solution: 'Sage identified SQL as the highest-impact skill gap, recommended a 4-week free SQL course, and suggested 3 portfolio projects using public datasets.', result: 'After 5 weeks, SQL was added to the profile. Scout match scores increased by 25%. Landed a Senior Analyst role requiring SQL.' },
      { title: 'From Junior to Senior Path', industry: 'Frontend Development', challenge: 'A junior frontend developer wanted to reach senior level but did not know which skills to prioritize.', solution: 'Sage analyzed 100+ senior frontend job descriptions and identified the top skill gaps: system design, testing, and performance optimization. Built a 3-month learning roadmap.', result: 'Completed the learning path in 10 weeks. Promoted to Mid-level in current company and began interviewing for senior roles.' },
    ],
    stats: [
      { label: 'Skill Gaps Identified', value: '30K+' },
      { label: 'Learning Paths Created', value: '8K+' },
      { label: 'Avg. Match Score Increase', value: '+25%' },
      { label: 'Courses Recommended', value: '15K+' },
    ],
  },

  sentinel: {
    slug: 'sentinel',
    name: 'Sentinel',
    displayName: 'Agent Sentinel',
    tagline: 'The Quality Gatekeeper Before Every Application',
    role: 'Quality Reviewer',
    heroDescription: 'Agent Sentinel reviews every application before it goes out. It catches errors, flags fabricated details, ensures cover letter relevance, and prevents spam-like mass applications that damage your reputation.',
    origin: 'Sentinel was born from a critical risk in AI automation: speed without quality. When agents can send 50 applications a day, the temptation is to spray and pray. But recruiters notice. Poorly tailored applications, irrelevant cover letters, and inflated claims damage your professional reputation. Sentinel is the quality gate. Before any application leaves your pipeline, Sentinel reviews it for accuracy, relevance, and professionalism. It catches hallucinated skills, verifies that the cover letter actually references the right company, and ensures every submission represents you authentically. Quality over quantity, enforced by AI.',
    gradient: 'from-rose-500/20 to-pink-500/20',
    colorHex: '#fb7185',
    features: [
      { title: 'Quality Scoring', description: 'Every application gets a quality score before submission. Low-scoring applications are held for review.' },
      { title: 'Fabrication Detection', description: 'Catches inflated claims, hallucinated skills, or experience that does not match your actual profile.' },
      { title: 'Relevance Check', description: 'Ensures the cover letter references the correct company, role, and requirements — no copy-paste mistakes.' },
      { title: 'Spam Prevention', description: 'Prevents mass-applying to similar roles at the same company or sending duplicate applications.' },
      { title: 'Tone & Professionalism', description: 'Reviews language for appropriate tone, grammar, and professional standards.' },
      { title: 'Compliance Flagging', description: 'Flags applications that might conflict with non-compete clauses or visa requirements you have specified.' },
    ],
    howItWorks: [
      { step: '01', title: 'Intercept Application', description: 'Before Archer sends anything, Sentinel receives the complete package — resume, cover letter, and job details.' },
      { step: '02', title: 'Multi-Point Review', description: 'Sentinel checks accuracy, relevance, tone, and quality against 12 different criteria.' },
      { step: '03', title: 'Approve or Flag', description: 'Applications scoring 80%+ quality are approved. Lower scores are held and sent back to Forge for improvement.' },
      { step: '04', title: 'Continuous Learning', description: 'Sentinel gets smarter over time — learning which types of applications get positive responses and adjusting standards.' },
    ],
    caseStudies: [
      { title: 'The Wrong Company Name Catch', industry: 'Consulting', challenge: 'During a high-volume application sprint, a cover letter was generated referencing Company A but was about to be sent to Company B.', solution: 'Sentinel flagged the mismatch in its relevance check — the cover letter mentioned the wrong company name and referenced incorrect projects.', result: 'The embarrassing mistake was caught before sending. The cover letter was regenerated correctly. That company ended up scheduling an interview.' },
      { title: 'Fabrication Prevention', industry: 'Product Management', challenge: 'An AI-generated resume variant had listed a certification the candidate had not actually completed yet.', solution: 'Sentinel cross-referenced the optimized resume against the original profile and flagged the unverified certification as potentially fabricated.', result: 'The false certification was removed before submission. The candidate was hired based on authentic qualifications and avoided potential background check issues.' },
    ],
    stats: [
      { label: 'Applications Reviewed', value: '80K+' },
      { label: 'Errors Caught', value: '12K+' },
      { label: 'Quality Approval Rate', value: '87%' },
      { label: 'Fabrications Flagged', value: '3K+' },
    ],
  },
};

export const AGENT_PAGE_LIST = Object.values(AGENT_PAGES);
export const AGENT_SLUGS = Object.keys(AGENT_PAGES);
