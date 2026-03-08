import type { Metadata } from 'next';
import ResumeScoreClient from './ResumeScoreClient';

export const metadata: Metadata = {
  title: 'Resume Score | jobTED AI',
  description:
    'Get an AI-powered score for your resume with detailed feedback on ATS compatibility, content quality, keywords, and more.',
};

export default function ResumeScorePage() {
  return <ResumeScoreClient />;
}
