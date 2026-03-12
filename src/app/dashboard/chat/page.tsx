'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';

export default function ChatPage() {
  const { isAutopilot } = useDashboardMode();
  const router = useRouter();

  // Redirect to dashboard if in Autopilot mode (Agent Chat is Agentic-only)
  useEffect(() => {
    if (isAutopilot) {
      router.replace('/dashboard');
    }
  }, [isAutopilot, router]);

  // Render Cortex workspace — same layout as all other agents
  return <AgenticWorkspace agentId="cortex" />;
}
