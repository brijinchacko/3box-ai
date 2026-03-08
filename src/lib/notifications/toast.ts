import toast from 'react-hot-toast';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { AgentId } from '@/lib/agents/registry';

const AGENT_LABELS: Record<string, string> = {
  scout: 'Scout',
  forge: 'Forge',
  archer: 'Archer',
  atlas: 'Atlas',
  sage: 'Sage',
  sentinel: 'Sentinel',
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
