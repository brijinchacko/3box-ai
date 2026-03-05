import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

const PHASES = [
  {
    name: 'Phase 1: India + US',
    description: 'Primary focus markets. Launch SEO, content marketing, YouTube channel, and establish brand presence in India and US markets. Target English-speaking professionals in tech, business, and career transition segments.',
    status: 'in_progress',
    progress: 15,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-08-31'),
    tasks: [
      { title: 'Technical SEO audit and fix all issues', category: 'technical', priority: 'critical', status: 'in_progress' },
      { title: 'Set up Google Search Console & Analytics 4', category: 'technical', priority: 'critical', status: 'completed' },
      { title: 'Implement schema markup (FAQ, HowTo, Organization)', category: 'technical', priority: 'high' },
      { title: 'Create XML sitemap and robots.txt optimization', category: 'technical', priority: 'high', status: 'completed' },
      { title: 'Set up regional pricing for India (INR)', category: 'technical', priority: 'high' },
      { title: 'Publish 12 blog articles (Month 1)', category: 'content', priority: 'critical', status: 'in_progress' },
      { title: 'Create 5 comparison landing pages', category: 'content', priority: 'high' },
      { title: 'Build "AI Career Tools" pillar page', category: 'content', priority: 'high' },
      { title: 'Write "Career Assessment" ultimate guide (3000+ words)', category: 'content', priority: 'high' },
      { title: 'Set up YouTube channel with branding', category: 'youtube', priority: 'high' },
      { title: 'Publish 4 YouTube videos (Month 1)', category: 'youtube', priority: 'medium' },
      { title: 'Create YouTube Shorts strategy (3x/week)', category: 'youtube', priority: 'medium' },
      { title: 'Launch Product Hunt campaign', category: 'social', priority: 'high' },
      { title: 'Reddit community engagement (r/careerguidance, r/resumes)', category: 'social', priority: 'medium' },
      { title: 'LinkedIn founder thought leadership posts (3x/week)', category: 'social', priority: 'medium' },
      { title: 'Twitter/X daily engagement and threads', category: 'social', priority: 'medium' },
      { title: 'Reach out to 10 career coaches for partnerships', category: 'partnerships', priority: 'high' },
      { title: 'Submit to 20 AI/SaaS directories', category: 'seo', priority: 'medium' },
      { title: 'Guest post outreach (10 sites)', category: 'seo', priority: 'medium' },
      { title: 'Set up email drip campaigns (welcome, onboarding, upgrade)', category: 'content', priority: 'high' },
    ],
  },
  {
    name: 'Phase 2: UK + Canada',
    description: 'Expand to English-speaking markets UK and Canada. Adapt content for local job markets, implement GBP/CAD pricing, and establish local partnerships with universities and career services.',
    status: 'not_started',
    progress: 0,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2027-02-28'),
    tasks: [
      { title: 'Implement GBP and CAD regional pricing', category: 'technical', priority: 'high' },
      { title: 'Create UK-specific career content (NHS, civil service)', category: 'content', priority: 'high' },
      { title: 'Create Canada-specific career content (Express Entry, NOC)', category: 'content', priority: 'high' },
      { title: 'UK university career services outreach (20 universities)', category: 'partnerships', priority: 'high' },
      { title: 'Canadian job board partnerships', category: 'partnerships', priority: 'medium' },
      { title: 'Localize landing pages for UK English', category: 'content', priority: 'medium' },
      { title: 'UK/Canada specific SEO keyword research', category: 'seo', priority: 'high' },
      { title: 'LinkedIn UK/Canada focused ad campaigns', category: 'social', priority: 'medium' },
      { title: 'PR outreach to UK tech publications', category: 'partnerships', priority: 'medium' },
      { title: 'Webinar series for UK/Canada job seekers', category: 'content', priority: 'medium' },
    ],
  },
  {
    name: 'Phase 3: UAE + GCC',
    description: 'Enter Middle East markets with Arabic language support, AED pricing, and content tailored to GCC job markets. Focus on expat professionals and local talent development.',
    status: 'not_started',
    progress: 0,
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-08-31'),
    tasks: [
      { title: 'Implement AED and SAR pricing', category: 'technical', priority: 'high' },
      { title: 'Arabic language UI translation', category: 'technical', priority: 'high' },
      { title: 'GCC-specific career content (visa, labor laws)', category: 'content', priority: 'high' },
      { title: 'Dubai/Abu Dhabi career fair participation', category: 'partnerships', priority: 'high' },
      { title: 'Partner with GCC recruitment agencies', category: 'partnerships', priority: 'high' },
      { title: 'Arabic SEO keyword strategy', category: 'seo', priority: 'high' },
      { title: 'Instagram and TikTok Arabic content', category: 'social', priority: 'medium' },
      { title: 'UAE university partnerships', category: 'partnerships', priority: 'medium' },
    ],
  },
  {
    name: 'Phase 4: Singapore + AU + NL',
    description: 'Expand to Asia-Pacific and European markets. Singapore as APAC hub, Australia for English-speaking Oceania, Netherlands as EU gateway. Multi-currency and local compliance.',
    status: 'not_started',
    progress: 0,
    startDate: new Date('2027-09-01'),
    endDate: new Date('2028-02-28'),
    tasks: [
      { title: 'Implement SGD, AUD, EUR pricing', category: 'technical', priority: 'high' },
      { title: 'GDPR compliance for EU (Netherlands)', category: 'technical', priority: 'critical' },
      { title: 'Singapore tech ecosystem content', category: 'content', priority: 'high' },
      { title: 'Australian job market guides', category: 'content', priority: 'high' },
      { title: 'Dutch/EU career transition content', category: 'content', priority: 'high' },
      { title: 'APAC startup ecosystem partnerships', category: 'partnerships', priority: 'high' },
      { title: 'Australian university outreach', category: 'partnerships', priority: 'medium' },
      { title: 'Dutch language basics for UI', category: 'technical', priority: 'medium' },
      { title: 'Local SEO for SG/AU/NL markets', category: 'seo', priority: 'high' },
    ],
  },
];

const KPI_DATA = [
  // Month 1 (March 2026)
  { name: 'Organic Traffic', category: 'traffic', target: 2000, unit: 'count', month: 3, year: 2026 },
  { name: 'Blog Articles Published', category: 'content', target: 12, unit: 'count', month: 3, year: 2026 },
  { name: 'Keywords in Top 10', category: 'traffic', target: 15, unit: 'count', month: 3, year: 2026 },
  { name: 'Registered Users', category: 'traffic', target: 200, unit: 'count', month: 3, year: 2026 },
  { name: 'Paying Subscribers', category: 'revenue', target: 20, unit: 'count', month: 3, year: 2026 },
  { name: 'Monthly Recurring Revenue', category: 'revenue', target: 400, unit: 'currency', month: 3, year: 2026 },
  { name: 'YouTube Subscribers', category: 'social', target: 200, unit: 'count', month: 3, year: 2026 },
  { name: 'Email Subscribers', category: 'content', target: 500, unit: 'count', month: 3, year: 2026 },
  { name: 'Backlinks Acquired', category: 'traffic', target: 30, unit: 'count', month: 3, year: 2026 },
  { name: 'Social Media Followers', category: 'social', target: 500, unit: 'count', month: 3, year: 2026 },
  // Month 3 (May 2026)
  { name: 'Organic Traffic', category: 'traffic', target: 8000, unit: 'count', month: 5, year: 2026 },
  { name: 'Blog Articles Published', category: 'content', target: 36, unit: 'count', month: 5, year: 2026 },
  { name: 'Keywords in Top 10', category: 'traffic', target: 50, unit: 'count', month: 5, year: 2026 },
  { name: 'Registered Users', category: 'traffic', target: 1000, unit: 'count', month: 5, year: 2026 },
  { name: 'Paying Subscribers', category: 'revenue', target: 100, unit: 'count', month: 5, year: 2026 },
  { name: 'Monthly Recurring Revenue', category: 'revenue', target: 2000, unit: 'currency', month: 5, year: 2026 },
  { name: 'YouTube Subscribers', category: 'social', target: 1000, unit: 'count', month: 5, year: 2026 },
  { name: 'Email Subscribers', category: 'content', target: 2000, unit: 'count', month: 5, year: 2026 },
  { name: 'Backlinks Acquired', category: 'traffic', target: 100, unit: 'count', month: 5, year: 2026 },
  { name: 'Social Media Followers', category: 'social', target: 2000, unit: 'count', month: 5, year: 2026 },
  // Month 6 (August 2026)
  { name: 'Organic Traffic', category: 'traffic', target: 25000, unit: 'count', month: 8, year: 2026 },
  { name: 'Blog Articles Published', category: 'content', target: 72, unit: 'count', month: 8, year: 2026 },
  { name: 'Keywords in Top 10', category: 'traffic', target: 150, unit: 'count', month: 8, year: 2026 },
  { name: 'Registered Users', category: 'traffic', target: 5000, unit: 'count', month: 8, year: 2026 },
  { name: 'Paying Subscribers', category: 'revenue', target: 500, unit: 'count', month: 8, year: 2026 },
  { name: 'Monthly Recurring Revenue', category: 'revenue', target: 10000, unit: 'currency', month: 8, year: 2026 },
  { name: 'YouTube Subscribers', category: 'social', target: 5000, unit: 'count', month: 8, year: 2026 },
  { name: 'Email Subscribers', category: 'content', target: 5000, unit: 'count', month: 8, year: 2026 },
  { name: 'Backlinks Acquired', category: 'traffic', target: 300, unit: 'count', month: 8, year: 2026 },
  { name: 'Social Media Followers', category: 'social', target: 8000, unit: 'count', month: 8, year: 2026 },
  // Month 12 (February 2027)
  { name: 'Organic Traffic', category: 'traffic', target: 100000, unit: 'count', month: 2, year: 2027 },
  { name: 'Blog Articles Published', category: 'content', target: 144, unit: 'count', month: 2, year: 2027 },
  { name: 'Keywords in Top 10', category: 'traffic', target: 500, unit: 'count', month: 2, year: 2027 },
  { name: 'Registered Users', category: 'traffic', target: 25000, unit: 'count', month: 2, year: 2027 },
  { name: 'Paying Subscribers', category: 'revenue', target: 2500, unit: 'count', month: 2, year: 2027 },
  { name: 'Monthly Recurring Revenue', category: 'revenue', target: 50000, unit: 'currency', month: 2, year: 2027 },
  { name: 'YouTube Subscribers', category: 'social', target: 25000, unit: 'count', month: 2, year: 2027 },
  { name: 'Email Subscribers', category: 'content', target: 15000, unit: 'count', month: 2, year: 2027 },
  { name: 'Backlinks Acquired', category: 'traffic', target: 1000, unit: 'count', month: 2, year: 2027 },
  { name: 'Social Media Followers', category: 'social', target: 30000, unit: 'count', month: 2, year: 2027 },
];

const CONTENT_CALENDAR = [
  // Week 1
  { title: 'How AI is Revolutionizing Career Planning in 2026', targetKeyword: 'AI career planning', keywordDifficulty: 35, category: 'blog', scheduledDate: new Date('2026-03-03') },
  { title: 'NXTED AI vs LinkedIn Career Explorer: Complete Comparison', targetKeyword: 'LinkedIn career explorer alternative', keywordDifficulty: 25, category: 'comparison', scheduledDate: new Date('2026-03-04') },
  { title: 'The Ultimate Guide to Career Assessments in 2026', targetKeyword: 'career assessment guide', keywordDifficulty: 40, category: 'blog', scheduledDate: new Date('2026-03-05') },
  // Week 2
  { title: '10 Best AI Resume Builders Compared', targetKeyword: 'best AI resume builder', keywordDifficulty: 55, category: 'comparison', scheduledDate: new Date('2026-03-10') },
  { title: 'How to Switch Careers Using AI Tools', targetKeyword: 'career switch AI tools', keywordDifficulty: 30, category: 'blog', scheduledDate: new Date('2026-03-11') },
  { title: 'Free Career Assessment: Find Your Ideal Tech Role', targetKeyword: 'free career assessment tech', keywordDifficulty: 45, category: 'landing_page', scheduledDate: new Date('2026-03-12') },
  // Week 3
  { title: 'AI Career Coach vs Human Career Coach: Pros & Cons', targetKeyword: 'AI career coach vs human', keywordDifficulty: 20, category: 'blog', scheduledDate: new Date('2026-03-17') },
  { title: 'How to Build a Portfolio That Gets You Hired', targetKeyword: 'portfolio tips get hired', keywordDifficulty: 38, category: 'blog', scheduledDate: new Date('2026-03-18') },
  { title: 'NXTED AI vs Jobscan: Which ATS Tool Wins?', targetKeyword: 'Jobscan alternative', keywordDifficulty: 30, category: 'comparison', scheduledDate: new Date('2026-03-19') },
  // Week 4
  { title: 'Top 15 In-Demand Tech Skills for 2026', targetKeyword: 'in-demand tech skills 2026', keywordDifficulty: 50, category: 'blog', scheduledDate: new Date('2026-03-24') },
  { title: 'How to Use AI to Prepare for Job Interviews', targetKeyword: 'AI interview preparation', keywordDifficulty: 35, category: 'blog', scheduledDate: new Date('2026-03-25') },
  { title: 'Career Planning for Fresh Graduates: A Complete Roadmap', targetKeyword: 'career planning fresh graduates', keywordDifficulty: 42, category: 'blog', scheduledDate: new Date('2026-03-26') },
  // Month 2 - Week 5
  { title: 'Remote Work Career Guide: Best Roles in 2026', targetKeyword: 'remote work careers 2026', keywordDifficulty: 48, category: 'blog', scheduledDate: new Date('2026-04-01') },
  { title: 'NXTED AI vs Careerflow: Feature-by-Feature Comparison', targetKeyword: 'Careerflow alternative', keywordDifficulty: 15, category: 'comparison', scheduledDate: new Date('2026-04-02') },
  { title: 'How to Negotiate Salary with AI-Powered Insights', targetKeyword: 'salary negotiation AI', keywordDifficulty: 25, category: 'blog', scheduledDate: new Date('2026-04-03') },
  // Month 2 - Week 6
  { title: 'The Complete Guide to ATS-Friendly Resumes', targetKeyword: 'ATS friendly resume guide', keywordDifficulty: 55, category: 'blog', scheduledDate: new Date('2026-04-08') },
  { title: 'AI Skills Assessment: Know Your Market Value', targetKeyword: 'AI skills assessment', keywordDifficulty: 30, category: 'landing_page', scheduledDate: new Date('2026-04-09') },
  { title: 'Career Transition: From Non-Tech to Tech in 6 Months', targetKeyword: 'non-tech to tech career transition', keywordDifficulty: 35, category: 'blog', scheduledDate: new Date('2026-04-10') },
  // Month 2 - Week 7
  { title: 'How to Create a Personal Brand for Job Search', targetKeyword: 'personal brand job search', keywordDifficulty: 40, category: 'blog', scheduledDate: new Date('2026-04-15') },
  { title: 'Best Career Planning Tools: 2026 Roundup', targetKeyword: 'best career planning tools', keywordDifficulty: 45, category: 'comparison', scheduledDate: new Date('2026-04-16') },
  { title: 'Video: How to Use NXTED AI Career Twin Feature', targetKeyword: 'NXTED AI tutorial', keywordDifficulty: 5, category: 'video', scheduledDate: new Date('2026-04-17') },
  // Month 2 - Week 8
  { title: 'Data Science Career Path: From Beginner to Senior', targetKeyword: 'data science career path', keywordDifficulty: 52, category: 'blog', scheduledDate: new Date('2026-04-22') },
  { title: 'Product Management Career Guide with AI Coaching', targetKeyword: 'product management career guide', keywordDifficulty: 48, category: 'blog', scheduledDate: new Date('2026-04-23') },
  { title: 'NXTED AI vs Teal HQ: Which Career Tool is Better?', targetKeyword: 'Teal HQ alternative', keywordDifficulty: 20, category: 'comparison', scheduledDate: new Date('2026-04-24') },
  // Month 3 - Week 9
  { title: 'UX Design Career Roadmap: Skills, Salary, Growth', targetKeyword: 'UX design career roadmap', keywordDifficulty: 45, category: 'blog', scheduledDate: new Date('2026-04-29') },
  { title: 'How AI Is Changing Recruitment: A Job Seekers Guide', targetKeyword: 'AI recruitment job seeker', keywordDifficulty: 30, category: 'blog', scheduledDate: new Date('2026-04-30') },
  { title: 'Free AI Resume Builder: Create Your Resume in Minutes', targetKeyword: 'free AI resume builder', keywordDifficulty: 60, category: 'landing_page', scheduledDate: new Date('2026-05-01') },
  // Month 3 - Week 10
  { title: 'Cybersecurity Career Guide: Roles, Certifications, Salary', targetKeyword: 'cybersecurity career guide', keywordDifficulty: 50, category: 'blog', scheduledDate: new Date('2026-05-06') },
  { title: 'LinkedIn Profile Optimization with AI: Step-by-Step', targetKeyword: 'LinkedIn profile optimization AI', keywordDifficulty: 35, category: 'blog', scheduledDate: new Date('2026-05-07') },
  { title: 'Video: 5-Minute Career Assessment Demo', targetKeyword: 'career assessment demo', keywordDifficulty: 10, category: 'video', scheduledDate: new Date('2026-05-08') },
  // Month 3 - Week 11
  { title: 'Software Engineer Career Ladder: Junior to Principal', targetKeyword: 'software engineer career ladder', keywordDifficulty: 42, category: 'blog', scheduledDate: new Date('2026-05-13') },
  { title: 'Career Gap Explanation: Templates and AI-Powered Tips', targetKeyword: 'career gap explanation', keywordDifficulty: 38, category: 'blog', scheduledDate: new Date('2026-05-14') },
  { title: 'NXTED AI vs Kickresume: Resume Builder Comparison', targetKeyword: 'Kickresume alternative', keywordDifficulty: 22, category: 'comparison', scheduledDate: new Date('2026-05-15') },
  // Month 3 - Week 12
  { title: 'How to Build a Tech Portfolio from Scratch', targetKeyword: 'tech portfolio from scratch', keywordDifficulty: 35, category: 'blog', scheduledDate: new Date('2026-05-20') },
  { title: 'AI-Powered Job Application Tracker: Why You Need One', targetKeyword: 'AI job application tracker', keywordDifficulty: 28, category: 'blog', scheduledDate: new Date('2026-05-21') },
  { title: 'Mid-Career Crisis? How AI Can Help You Pivot', targetKeyword: 'mid-career crisis AI help', keywordDifficulty: 18, category: 'blog', scheduledDate: new Date('2026-05-22') },
  { title: 'The Future of Career Development: AI Trends 2026-2030', targetKeyword: 'future career development AI', keywordDifficulty: 32, category: 'blog', scheduledDate: new Date('2026-05-25') },
];

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();

  try {
    // Check if data already exists
    const existingPhases = await prisma.marketingPhase.count();
    if (existingPhases > 0) {
      return NextResponse.json(
        { error: 'Marketing data already seeded. Delete existing data first to re-seed.' },
        { status: 400 }
      );
    }

    // Seed phases with tasks
    for (const phaseData of PHASES) {
      const { tasks, ...phaseFields } = phaseData;
      const phase = await prisma.marketingPhase.create({
        data: {
          ...phaseFields,
          tasks: {
            create: tasks.map((t: any) => ({
              title: t.title,
              category: t.category || 'seo',
              priority: t.priority || 'medium',
              status: t.status || 'pending',
              completedAt: t.status === 'completed' ? new Date() : null,
            })),
          },
        },
      });
    }

    // Seed KPIs
    for (const kpi of KPI_DATA) {
      await prisma.marketingKPI.create({
        data: {
          name: kpi.name,
          category: kpi.category,
          target: kpi.target,
          current: 0,
          unit: kpi.unit,
          period: 'monthly',
          month: kpi.month,
          year: kpi.year,
        },
      });
    }

    // Seed content calendar
    for (const item of CONTENT_CALENDAR) {
      await prisma.contentCalendar.create({
        data: {
          title: item.title,
          targetKeyword: item.targetKeyword,
          keywordDifficulty: item.keywordDifficulty,
          category: item.category,
          status: 'planned',
          scheduledDate: item.scheduledDate,
          author: 'NXTED AI Team',
        },
      });
    }

    const [phaseCount, taskCount, kpiCount, contentCount] = await Promise.all([
      prisma.marketingPhase.count(),
      prisma.marketingTask.count(),
      prisma.marketingKPI.count(),
      prisma.contentCalendar.count(),
    ]);

    return NextResponse.json({
      success: true,
      seeded: {
        phases: phaseCount,
        tasks: taskCount,
        kpis: kpiCount,
        contentItems: contentCount,
      },
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: err.message || 'Failed to seed data' }, { status: 500 });
  }
}
