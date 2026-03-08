import type { Metadata } from 'next';
import JDAnalyzerClient from './JDAnalyzerClient';

export const metadata: Metadata = {
  title: 'Job Description Analyzer | jobTED AI',
  description:
    'Decode any job description with AI. Extract requirements, skills, keywords, red flags, hidden expectations, and actionable tips.',
};

export default function JobDescriptionAnalyzerPage() {
  return <JDAnalyzerClient />;
}
