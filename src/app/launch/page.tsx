import type { Metadata } from 'next';
import LaunchPageClient from './LaunchPageClient';

export const metadata: Metadata = {
  title: 'Hire Your AI Job Hunting Team | 3BOX AI',
  description:
    'Stop scrolling job boards. 6 AI agents search, tailor, and apply to jobs while you sleep. Wake up to interviews. Try free — no card required.',
  // Ad landing pages should not compete with the main site in organic search.
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Hire Your AI Job Hunting Team | 3BOX AI',
    description:
      '6 AI agents apply to jobs while you sleep. Wake up to interviews.',
    type: 'website',
    url: 'https://3box.ai/launch',
  },
};

export default function LaunchPage() {
  return <LaunchPageClient />;
}
