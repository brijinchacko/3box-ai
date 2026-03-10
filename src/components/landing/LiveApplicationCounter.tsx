'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function LiveApplicationCounter({ className = '' }: { className?: string }) {
  const [total, setTotal] = useState(0);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch('/api/free-burst/counter')
      .then((r) => r.json())
      .then((d) => {
        if (d.totalApplied && d.totalApplied > 0) {
          setTotal(d.totalApplied);
        }
      })
      .catch(() => {});
  }, []);

  // Only show if we have real data from the API
  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5 text-xs text-white/40 ${className}`}
    >
      <Users className="w-3 h-3 text-neon-green" />
      <span>Used by <span className="text-white/60 font-medium">{total.toLocaleString()}+</span> job seekers</span>
    </motion.div>
  );
}
