'use client';

import { motion } from 'framer-motion';
import AgentAvatar from './AgentAvatar';
import CortexAvatar from './CortexAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';

interface AgentLoaderProps {
  /** Which agent to show. Omit or pass 'cortex' for Cortex. */
  agentId?: AgentId | 'cortex';
  /** Message shown below the avatar. Defaults to "[Agent] is working on it" */
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizes = { sm: 48, md: 64, lg: 96 };

function getDefaultMessage(agentId?: AgentId | 'cortex'): string {
  if (!agentId || agentId === 'cortex') return 'Cortex is working on it';
  const agent = AGENTS[agentId];
  return agent ? `${agent.displayName} is working on it` : 'Working on it';
}

export default function AgentLoader({ agentId, message, size = 'md', fullScreen = false }: AgentLoaderProps) {
  const avatarSize = sizes[size];
  const displayMessage = message ?? getDefaultMessage(agentId);

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-4"
    >
      {(!agentId || agentId === 'cortex') ? (
        <CortexAvatar size={avatarSize} pulse expression="thinking" />
      ) : (
        <AgentAvatar agentId={agentId} size={avatarSize} pulse />
      )}
      <div className="flex items-center gap-1">
        <span className="text-sm text-white/40">{displayMessage}</span>
        <motion.span
          className="text-sm text-white/40"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ...
        </motion.span>
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {content}
    </div>
  );
}
