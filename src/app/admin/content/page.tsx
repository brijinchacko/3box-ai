'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Mail, Megaphone, ArrowRight, Loader2 } from 'lucide-react';

interface ContentStats {
  blogPosts: number;
  newsletters: number;
  changelogs: number;
}

const cards = [
  {
    href: '/admin/content/blog',
    icon: FileText,
    label: 'Blog Posts',
    desc: 'Create, edit, and manage blog articles.',
    statKey: 'blogPosts' as const,
    color: 'from-neon-blue to-cyan-400',
  },
  {
    href: '/admin/content/newsletter',
    icon: Mail,
    label: 'Newsletter',
    desc: 'Manage subscribers and send campaigns.',
    statKey: 'newsletters' as const,
    color: 'from-neon-purple to-violet-400',
  },
  {
    href: '/admin/content/changelog',
    icon: Megaphone,
    label: 'Changelog',
    desc: 'Publish product updates and announcements.',
    statKey: 'changelogs' as const,
    color: 'from-neon-green to-emerald-400',
  },
];

export default function AdminContentPage() {
  const [stats, setStats] = useState<ContentStats>({ blogPosts: 0, newsletters: 0, changelogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/blog?pageSize=1').then((r) => r.json()),
      fetch('/api/admin/newsletter').then((r) => r.json()),
      fetch('/api/admin/changelog').then((r) => r.json()),
    ])
      .then(([blogData, nlData, clData]) => {
        setStats({
          blogPosts: blogData.total || 0,
          newsletters: nlData.campaigns?.length || 0,
          changelogs: clData.entries?.length || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Content</h1>
      <p className="text-white/40 text-sm mb-8">Manage blog posts, newsletters, and product updates.</p>

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={card.href}
                className="block p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
                  ) : (
                    <span className="text-xs font-medium text-white/30 bg-white/[0.05] px-2 py-1 rounded-full">
                      {stats[card.statKey]}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold mb-1 group-hover:text-white transition-colors">
                  {card.label}
                </h3>
                <p className="text-xs text-white/35 mb-4">{card.desc}</p>
                <div className="flex items-center gap-1 text-xs text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  Manage <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
