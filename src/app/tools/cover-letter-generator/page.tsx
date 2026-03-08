import type { Metadata } from 'next';
import CoverLetterClient from './CoverLetterClient';

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator | 3BOX AI',
  description: 'Generate a personalized, compelling cover letter for any job description in seconds with AI.',
};

export default function CoverLetterPage() {
  return <CoverLetterClient />;
}
