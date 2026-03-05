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
        },
      },
    },
  });
  return portfolio;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const portfolio = await getPortfolio(username);

  if (!portfolio) {
    return { title: 'Portfolio Not Found | NXTED AI' };
  }

  const description = portfolio.bio
    || `${portfolio.user.name}'s professional portfolio showcasing projects and skills.`;

  return {
    title: `${portfolio.title} | ${portfolio.user.name} - NXTED AI`,
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

  return <PortfolioPublicClient portfolio={portfolioData} user={userData} />;
}
