import type { Metadata } from 'next';
import LinkedInPostClient from './LinkedInPostClient';

export const metadata: Metadata = {
  title: 'LinkedIn Post Generator | jobTED AI',
  description:
    'Generate engaging LinkedIn posts with AI. Craft scroll-stopping hooks, compelling stories, and effective calls-to-action tailored to your audience.',
};

export default function LinkedInPostGeneratorPage() {
  return <LinkedInPostClient />;
}
