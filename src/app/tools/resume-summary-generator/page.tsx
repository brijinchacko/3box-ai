import type { Metadata } from 'next';
import ResumeSummaryClient from './ResumeSummaryClient';

export const metadata: Metadata = {
  title: 'Resume Summary Generator | jobTED AI',
  description:
    'Generate compelling professional summary paragraphs for your resume with AI. ATS-friendly, achievement-focused, and tailored to your target role.',
};

export default function ResumeSummaryGeneratorPage() {
  return <ResumeSummaryClient />;
}
