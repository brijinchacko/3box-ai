'use client';

import { motion } from 'framer-motion';
import CortexAvatar from './CortexAvatar';

interface CortexLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizes = { sm: 48, md: 64, lg: 96 };

export default function CortexLoader({ message = 'Loading...', size = 'md', fullScreen = false }: CortexLoaderProps) {
  const avatarSize = sizes[size];

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-4"
    >
      <CortexAvatar size={avatarSize} pulse expression="thinking" />
      <div className="flex items-center gap-1">
        <span className="text-sm text-white/40">{message}</span>
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
