import type { Metadata } from 'next';
import ResumeGeneratorClient from './ResumeGeneratorClient';

export const metadata: Metadata = {
  title: 'AI Resume Generator | 3BOX AI',
  description: 'Generate a complete, ATS-optimized resume tailored to your target role in seconds with AI.',
};

export default function ResumeGeneratorPage() {
  return <ResumeGeneratorClient />;
}
