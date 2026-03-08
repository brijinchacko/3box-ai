import type { Metadata } from 'next';
import InterviewPrepClient from './InterviewPrepClient';

export const metadata: Metadata = {
  title: 'AI Interview Question Prep | jobTED AI',
  description: 'Prepare for your next interview with AI-generated questions, expert tips, and sample answers tailored to your target role.',
};

export default function InterviewPrepPage() {
  return <InterviewPrepClient />;
}
