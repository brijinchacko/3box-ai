import type { Metadata } from 'next';
import ColdEmailClient from './ColdEmailClient';

export const metadata: Metadata = {
  title: 'Cold Email Generator | jobTED AI',
  description:
    'Write concise, compelling cold emails for job inquiries, networking, informational interviews, and referral requests.',
};

export default function ColdEmailPage() {
  return <ColdEmailClient />;
}
