import toast from 'react-hot-toast';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { AgentId } from '@/lib/agents/registry';

const AGENT_LABELS: Record<string, string> = {
  scout: 'Agent Scout',
  forge: 'Agent Forge',
  archer: 'Agent Archer',
  atlas: 'Agent Atlas',
  sage: 'Agent Sage',
  sentinel: 'Agent Sentinel',
  cortex: 'Agent Cortex',
};

export function notifyAgentStarted(agent: AgentId, message: string) {
  const label = AGENT_LABELS[agent] || agent;
  toast(`${label}: ${message}`, {
    icon: '🚀',
    duration: 4000,
  });
  useNotificationStore.getState().addNotification({
    type: 'info',
    title: `${label} Started`,
    message,
    agent,
  });
}

export function notifyAgentCompleted(agent: AgentId, message: string, action?: string) {
  const label = AGENT_LABELS[agent] || agent;
  toast.success(`${label}: ${message}`, {
    duration: 5000,
  });
  useNotificationStore.getState().addNotification({
    type: 'success',
    title: `${label} Completed`,
    message,
    agent,
    action,
  });
}

export function notifyAgentError(agent: AgentId, message: string) {
  const label = AGENT_LABELS[agent] || agent;
  toast.error(`${label}: ${message}`, {
    duration: 8000,
  });
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: `${label} Error`,
    message,
    agent,
  });
}

export function notifyResumeBlocked(agent: AgentId, issues: string[], recommendation: string) {
  const label = AGENT_LABELS[agent] || agent;
  const issueCount = issues.length;
  toast.error(`${label}: Resume blocked — ${issueCount} critical issue${issueCount !== 1 ? 's' : ''} found`, {
    duration: 10000,
  });
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: `${label}: Resume Not Ready`,
    message: `${issueCount} issue${issueCount !== 1 ? 's' : ''} found: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? '...' : ''}. ${recommendation}`,
    agent,
    action: '/dashboard/resume',
  });
}

export function notifyInfo(title: string, message: string) {
  toast(message, {
    icon: 'ℹ️',
    duration: 4000,
  });
  useNotificationStore.getState().addNotification({
    type: 'info',
    title,
    message,
  });
}
