import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AGENT_PAGES, AGENT_SLUGS } from '@/lib/agents/agentContent';
import AgentDetailClient from './AgentDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return AGENT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = AGENT_PAGES[slug];
  if (!agent) return { title: 'Agent Not Found | jobTED AI' };

  return {
    title: `${agent.displayName} — ${agent.tagline} | jobTED AI`,
    description: agent.heroDescription,
  };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const agent = AGENT_PAGES[slug];
  if (!agent) notFound();

  return <AgentDetailClient slug={slug} />;
}
