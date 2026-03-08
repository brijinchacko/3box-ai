'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, FileText, Send, Shield, CheckCircle2, XCircle,
  Clock, ChevronDown, ChevronUp, BookOpen, Target, Hammer,
  Compass, Zap,
} from 'lucide-react';
import { AGENTS, type AgentId } from '@/lib/agents/registry';

interface ActivityItem {
  id: string;
  action: string;
  summary: string;
  details?: string;
  timestamp: string;
  status: 'success' | 'error' | 'info' | 'warning';
}

const actionIcons: Record<string, any> = {
  discovered_jobs: Search,
  scored_matches: Target,
  filtered_results: Search,
  optimized_resume: Hammer,
  ats_analysis: FileText,
  keyword_enhancement: Zap,
  generated_cover_letter: FileText,
  sent_application: Send,
  sent_email: Send,
  queued_portal: Send,
  generated_questions: Compass,
  created_scenario: BookOpen,
  analyzed_jd: FileText,
  identified_gaps: Search,
  recommended_learning: BookOpen,
  tracked_growth: Zap,
  reviewed_application: Shield,
  approved_application: CheckCircle2,
  rejected_application: XCircle,
};

const statusColors: Record<string, string> = {
  success: 'text-neon-green bg-neon-green/10 border-neon-green/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-neon-blue bg-neon-blue/10 border-neon-blue/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function AgentActivityLog({ agentId }: { agentId: AgentId }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const agent = AGENTS[agentId];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/agents/activity?agent=${agentId}&limit=20`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.activities) {
          setActivities(data.activities);
          setHasMore(data.hasMore ?? false);
        }
      })
      .catch(() => {
        // API may not exist yet — that's fine
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/5 rounded w-3/4" />
              <div className="h-2 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-sm text-white/40 mb-1">No activity yet</p>
        <p className="text-xs text-white/20">
          Run <span className={agent.color}>{agent.displayName}</span> to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const Icon = actionIcons[activity.action] || Zap;
        const colorClass = statusColors[activity.status] || statusColors.info;
        const expanded = expandedId === activity.id;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <button
              onClick={() => activity.details ? setExpandedId(expanded ? null : activity.id) : undefined}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                activity.details ? 'hover:bg-white/[0.03] cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Icon */}
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white/70 leading-snug">{activity.summary}</p>
                  <span className="text-[10px] text-white/20 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {timeAgo(activity.timestamp)}
                  </span>
                </div>

                {/* Expanded details */}
                {expanded && activity.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-2 text-xs text-white/40 leading-relaxed bg-white/[0.02] rounded-lg p-2.5"
                  >
                    {activity.details}
                  </motion.div>
                )}
              </div>

              {/* Expand indicator */}
              {activity.details && (
                <div className="text-white/15 mt-1">
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              )}
            </button>
          </motion.div>
        );
      })}

      {hasMore && (
        <button className="w-full py-2.5 text-xs text-white/30 hover:text-white/50 transition-colors">
          Load more activity...
        </button>
      )}
    </div>
  );
}
