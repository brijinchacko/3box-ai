import type { Metadata } from 'next';
import AgentsHubClient from './AgentsHubClient';

export const metadata: Metadata = {
  title: 'AI Agents | jobTED AI — Meet Your Agent Team',
  description: 'Meet the 6 AI agents that power your automated job search. From Scout the job hunter to Sentinel the quality reviewer — each agent has a mission.',
};

export default function AgentsPage() {
  return <AgentsHubClient />;
}
