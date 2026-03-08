import type { Metadata } from 'next';
import LinkedInHashtagClient from './LinkedInHashtagClient';

export const metadata: Metadata = {
  title: 'LinkedIn Hashtag Generator | 3BOX AI',
  description:
    'Generate trending, relevant LinkedIn hashtags for your posts. Mix popular broad hashtags with niche-specific ones to maximize reach and engagement.',
};

export default function LinkedInHashtagGeneratorPage() {
  return <LinkedInHashtagClient />;
}
