import type { Metadata } from 'next';
import ToolsPageClient from './ToolsPageClient';

export const metadata: Metadata = {
  title: 'Free AI Career Tools | 3BOX AI',
  description:
    '17 free AI-powered career tools: resume builder, LinkedIn optimizer, cover letter generator, interview prep, and more. No signup required.',
};

export default function ToolsPage() {
  return <ToolsPageClient />;
}
