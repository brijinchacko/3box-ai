import type { Metadata } from 'next';
import ThankYouEmailClient from './ThankYouEmailClient';

export const metadata: Metadata = {
  title: 'Thank You Email Generator | 3BOX AI',
  description:
    'Generate a genuine, personalized post-interview thank you email that reinforces your interest and qualifications.',
};

export default function ThankYouEmailPage() {
  return <ThankYouEmailClient />;
}
