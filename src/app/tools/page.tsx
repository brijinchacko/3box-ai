import type { Metadata } from 'next';
import ToolsPageClient from './ToolsPageClient';

export const metadata: Metadata = {
  title: 'Free AI Career Tools | NXTED AI',
  description:
    'Use free AI-powered career tools including ATS resume checker and salary estimator. No signup required.',
};

export default function ToolsPage() {
  return <ToolsPageClient />;
}
