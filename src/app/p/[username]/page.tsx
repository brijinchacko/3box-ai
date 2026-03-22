import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import PortfolioPublicClient from './PortfolioPublicClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getPortfolio(slug: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug, isPublic: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          resumes: {
            where: { isFinalized: true },
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { content: true },
          },
          careerTwin: {
            select: {
              targetRoles: true,
              skillSnapshot: true,
            },
          },
        },
      },
    },
  });
  return portfolio;
}

async function getUserStory(userId: string): Promise<string | null> {
  try {
    const careerTwin = await prisma.careerTwin.findUnique({
      where: { userId },
      select: { skillSnapshot: true },
    });
    const snap = (careerTwin?.skillSnapshot as any) || {};
    return snap._story?.text || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const portfolio = await getPortfolio(username);

  if (!portfolio) {
    return { title: 'Portfolio Not Found | 3BOX AI' };
  }

  const description = portfolio.bio
    || `${portfolio.user.name}'s professional portfolio showcasing projects and skills.`;

  return {
    title: `${portfolio.title} | ${portfolio.user.name} - 3BOX AI`,
    description,
    openGraph: {
      title: `${portfolio.title} | ${portfolio.user.name}`,
      description,
      type: 'profile',
      ...(portfolio.user.image ? { images: [{ url: portfolio.user.image }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: `${portfolio.title} | ${portfolio.user.name}`,
      description,
    },
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const portfolio = await getPortfolio(username);

  if (!portfolio) {
    notFound();
  }

  // Fetch the user's story from CareerTwin
  const story = await getUserStory(portfolio.user.id);

  // Extract target role from CareerTwin
  const targetRoles = (portfolio.user.careerTwin?.targetRoles as any[]) || [];
  const targetRole = targetRoles.length > 0 ? targetRoles[0]?.title || null : null;

  // Extract resume content (experience, education, contact)
  const resumeContent = (portfolio.user.resumes?.[0]?.content as any) || null;

  // Serialize dates for the client component
  const portfolioData = {
    id: portfolio.id,
    title: portfolio.title,
    bio: portfolio.bio,
    projects: portfolio.projects as Array<{
      id: string;
      title: string;
      description: string;
      skills: string[];
      image: string | null;
      github: string;
      live: string;
      status: string;
      score: number | null;
    }>,
    skills: portfolio.skills as string[],
    theme: portfolio.theme,
    slug: portfolio.slug,
  };

  const userData = {
    name: portfolio.user.name,
    email: portfolio.user.email,
    image: portfolio.user.image,
  };

  // Build resume data for experience/education sections
  const resumeData = resumeContent
    ? {
        experience: (resumeContent.experience || []) as Array<{
          id: string;
          company: string;
          role: string;
          location: string;
          startDate: string;
          endDate: string;
          current: boolean;
          bullets: string[];
        }>,
        education: (resumeContent.education || []) as Array<{
          id: string;
          institution: string;
          degree: string;
          field: string;
          startDate: string;
          endDate: string;
          gpa?: string;
        }>,
        contact: resumeContent.contact
          ? {
              linkedin: resumeContent.contact.linkedin || null,
              portfolio: resumeContent.contact.portfolio || null,
              phone: resumeContent.contact.phone || null,
            }
          : null,
      }
    : null;

  return (
    <PortfolioPublicClient
      portfolio={portfolioData}
      user={userData}
      story={story}
      targetRole={targetRole}
      resumeData={resumeData}
    />
  );
}
