import type { Metadata } from 'next';
import LinkedInRecommendationClient from './LinkedInRecommendationClient';

export const metadata: Metadata = {
  title: 'LinkedIn Recommendation Writer | jobTED AI',
  description:
    'Write genuine, specific LinkedIn recommendations with AI. Generate authentic recommendations that highlight skills, achievements, and professional qualities.',
};

export default function LinkedInRecommendationGeneratorPage() {
  return <LinkedInRecommendationClient />;
}
