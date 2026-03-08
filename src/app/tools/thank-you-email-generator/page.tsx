import type { Metadata } from 'next';
import ThankYouEmailClient from './ThankYouEmailClient';

export const metadata: Metadata = {
  title: 'Thank You Email Generator | jobTED AI',
  description:
    'Generate a genuine, personalized post-interview thank you email that reinforces your interest and qualifications.',
};

export default function ThankYouEmailPage() {
  return <ThankYouEmailClient />;
}
