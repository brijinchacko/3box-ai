import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Salary Estimator | Know Your Market Worth | 3BOX AI',
  description: 'Get instant AI-powered salary estimates for any role, location, and experience level. Compare market rates, negotiate better offers, and understand your worth.',
  keywords: ['salary estimator', 'salary calculator', 'AI salary estimate', 'market salary', 'salary negotiation', 'compensation calculator', 'how much should I earn'],
  openGraph: {
    title: 'AI Salary Estimator | 3BOX AI',
    description: 'Get instant AI-powered salary estimates for any role and location. Know your market worth.',
    url: 'https://3box.ai/tools/salary-estimator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
