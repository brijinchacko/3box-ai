import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ─── Static pages ────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    // Core pages (highest priority)
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${SITE_URL}/get-started`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // About & company
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/case-studies`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE_URL}/press`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },

    // Agents showcase
    { url: `${SITE_URL}/agents`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Blog
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

    // Tools hub
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Individual tools (high SEO value — free tools)
    { url: `${SITE_URL}/tools/resume-builder`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/tools/ats-checker`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/tools/salary-estimator`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/tools/cover-letter-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/resume-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/resume-score`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/resume-summary-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/interview-question-prep`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/job-description-analyzer`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/cold-email-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/elevator-pitch-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/linkedin-headline-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/linkedin-post-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/linkedin-hashtag-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/linkedin-recommendation-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/skills-gap-finder`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools/thank-you-email-generator`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Industry resume landing pages (SEO-targeted)
    { url: `${SITE_URL}/resume/software-engineer`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/resume/data-scientist`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/resume/nurse`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/resume/teacher`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/resume/career-changer`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Comparison pages (SEO-targeted)
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/compare/all`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/compare/jobscan`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/compare/teal`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/compare/rezi`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Help & support
    { url: `${SITE_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Auth pages
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },

    // Legal pages
    { url: `${SITE_URL}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/gdpr`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  // ─── Dynamic blog posts ────────────────────────────────
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    blogPages = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt.toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // DB not available — skip dynamic pages
  }

  // ─── Dynamic agent pages ───────────────────────────────
  const agentSlugs = ['scout', 'forge', 'archer', 'atlas', 'sage', 'sentinel'];
  const agentPages: MetadataRoute.Sitemap = agentSlugs.map((slug) => ({
    url: `${SITE_URL}/agents/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...agentPages];
}
