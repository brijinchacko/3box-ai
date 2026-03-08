import type { Metadata } from 'next';
import LinkedInHeadlineClient from './LinkedInHeadlineClient';

export const metadata: Metadata = {
  title: 'LinkedIn Headline Generator | jobTED AI',
  description:
    'Generate attention-grabbing LinkedIn headlines that attract recruiters and clients. AI-powered, unique styles, and optimized for search.',
};

export default function LinkedInHeadlineGeneratorPage() {
  return <LinkedInHeadlineClient />;
}
