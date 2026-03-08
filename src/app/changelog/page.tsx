'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Wrench, Bug, Megaphone } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ChangelogEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  feature: { icon: Sparkles, color: 'bg-neon-blue/15 text-neon-blue', label: 'Feature' },
  improvement: { icon: Wrench, color: 'bg-neon-purple/15 text-neon-purple', label: 'Improvement' },
  bugfix: { icon: Bug, color: 'bg-neon-green/15 text-neon-green', label: 'Bug Fix' },
  announcement: { icon: Megaphone, color: 'bg-amber-500/15 text-amber-400', label: 'Announcement' },
};

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/changelog')
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Changelog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-lg"
          >
            Latest updates and improvements to jobTED AI.
          </motion.p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">No updates yet. Check back soon!</div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.06]" />

            <div className="space-y-6">
              {entries.map((entry, i) => {
                const config = categoryConfig[entry.category] || categoryConfig.feature;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative pl-12"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-2 top-2 w-5 h-5 rounded-full bg-surface border-2 border-white/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-neon-blue" />
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${config.color}`}>
                          <Icon className="w-3 h-3" /> {config.label}
                        </span>
                        {entry.version && (
                          <span className="text-[10px] text-white/25 font-mono">{entry.version}</span>
                        )}
                        <span className="text-[10px] text-white/20">
                          {new Date(entry.publishedAt || entry.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold mb-2">{entry.title}</h3>
                      <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
