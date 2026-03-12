'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';

// -- Types ------------------------------------------------------------------

interface ReviewIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

interface ReviewedApplication {
  id: string;
  company: string;
  jobTitle: string;
  qualityScore: number;
  status: 'approved' | 'rejected';
  issues: ReviewIssue[];
  coverLetterSnippet: string;
  resumeMatchPercent: number;
  reviewedAt: string;
}

// -- Mock Data --------------------------------------------------------------

const MOCK_REVIEWS: ReviewedApplication[] = [
  {
    id: 'rev-001',
    company: 'Stripe',
    jobTitle: 'Senior Full Stack Engineer',
    qualityScore: 94,
    status: 'approved',
    issues: [
      { type: 'info', message: 'Cover letter length is within optimal range' },
    ],
    coverLetterSnippet:
      'Drawing on my 5 years of experience building high-throughput payment systems with Node.js and React, I am excited to contribute to Stripe\'s mission of increasing the GDP of the internet...',
    resumeMatchPercent: 88,
    reviewedAt: '2026-03-07T09:15:00Z',
  },
  {
    id: 'rev-002',
    company: 'Notion',
    jobTitle: 'Product Designer',
    qualityScore: 72,
    status: 'approved',
    issues: [
      { type: 'warning', message: 'Cover letter could include more specific Notion product references' },
      { type: 'info', message: 'Portfolio link detected and verified' },
    ],
    coverLetterSnippet:
      'As a product designer with a passion for collaborative tools and clean information architecture, I believe my background in designing SaaS dashboards aligns well...',
    resumeMatchPercent: 74,
    reviewedAt: '2026-03-06T16:42:00Z',
  },
  {
    id: 'rev-003',
    company: 'Meta',
    jobTitle: 'ML Engineer',
    qualityScore: 38,
    status: 'rejected',
    issues: [
      { type: 'error', message: 'Claimed experience with PyTorch 3.0 which does not exist' },
      { type: 'error', message: 'Cover letter references wrong company name (Google instead of Meta)' },
      { type: 'warning', message: 'Resume skills section missing required ML Ops experience' },
    ],
    coverLetterSnippet:
      'I am excited to apply for the ML Engineer role at Google. With my extensive experience in PyTorch 3.0 and advanced deep learning frameworks...',
    resumeMatchPercent: 41,
    reviewedAt: '2026-03-06T11:20:00Z',
  },
  {
    id: 'rev-004',
    company: 'Shopify',
    jobTitle: 'Staff Backend Developer',
    qualityScore: 87,
    status: 'approved',
    issues: [
      { type: 'info', message: 'Strong alignment between resume keywords and job requirements' },
      { type: 'warning', message: 'Consider mentioning experience with Ruby on Rails explicitly' },
    ],
    coverLetterSnippet:
      'Having scaled distributed systems serving millions of merchants, I am drawn to Shopify\'s engineering challenges around commerce infrastructure...',
    resumeMatchPercent: 82,
    reviewedAt: '2026-03-05T14:05:00Z',
  },
  {
    id: 'rev-005',
    company: 'Figma',
    jobTitle: 'Frontend Engineer',
    qualityScore: 45,
    status: 'rejected',
    issues: [
      { type: 'error', message: 'Cover letter appears to be a generic template with no company-specific content' },
      { type: 'warning', message: 'Resume lacks required WebGL/Canvas experience listed in JD' },
      { type: 'warning', message: 'Application tone is too informal for this role level' },
    ],
    coverLetterSnippet:
      'Dear Hiring Manager, I am writing to express my interest in the open position at your company. I have several years of experience in web development...',
    resumeMatchPercent: 52,
    reviewedAt: '2026-03-04T08:30:00Z',
  },
];

// -- Helpers ----------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffHours < 1) return 'Just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} week(s) ago`;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-rose-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-rose-500/10 border-rose-500/20';
  if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/20';
  return 'bg-red-400/10 border-red-400/20';
}

function issueIcon(type: ReviewIssue['type']) {
  switch (type) {
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />;
    case 'warning':
      return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />;
    case 'info':
      return <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0 mt-0.5" />;
  }
}

// -- Skeleton ---------------------------------------------------------------

function ReviewCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/10 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 bg-white/5 rounded-full" />
            <div className="h-5 w-24 bg-white/5 rounded-full" />
            <div className="h-5 w-16 bg-white/5 rounded-full" />
          </div>
        </div>
        <div className="h-12 w-12 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card animate-pulse text-center py-5">
      <div className="h-4 w-4 bg-white/10 rounded mx-auto mb-3" />
      <div className="h-8 w-16 bg-white/10 rounded mx-auto mb-2" />
      <div className="h-3 w-20 bg-white/5 rounded mx-auto" />
    </div>
  );
}

// -- Main Page Component ----------------------------------------------------

export default function QualityReviewPage() {
  const { data: session } = useSession();
  const { isAgentic } = useDashboardMode();
  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase() as PlanTier;
  const agentLocked = !isAgentAvailable('sentinel', userPlan);

  // In Agentic mode, render Cortex-style agent workspace for Sentinel
  if (isAgentic) return <AgenticWorkspace agentId="sentinel" />;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'rejected'>('all');
  const [loading] = useState(false);

  // Computed stats from mock data
  const reviews = MOCK_REVIEWS;
  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;
  const avgScore =
    totalReviews > 0
      ? Math.round(reviews.reduce((sum, r) => sum + r.qualityScore, 0) / totalReviews)
      : 0;

  // Filter reviews
  const filteredReviews =
    filterStatus === 'all'
      ? reviews
      : reviews.filter((r) => r.status === filterStatus);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // -- Locked state ---------------------------------------------------------
  if (agentLocked) return <AgentLockedPage agentId="sentinel" />;

  // -- Loading state --------------------------------------------------------
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <AgentPageHeader agentId="sentinel" />
        <AgentLoader agentId="sentinel" message="Agent Sentinel is reviewing your applications" />
      </div>
    );
  }

  // -- Main content ---------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto">
      <AgentPageHeader agentId="sentinel" />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Shield className="w-7 h-7 text-rose-400" /> Quality Review
        </h1>
        <p className="text-white/40">
          Every application is reviewed for accuracy, relevance, and quality before submission.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Reviews',
            value: totalReviews,
            icon: FileCheck,
            color: 'text-rose-400',
            bg: 'bg-rose-400/10',
          },
          {
            label: 'Approved',
            value: approvedCount,
            icon: CheckCircle2,
            color: 'text-rose-400',
            bg: 'bg-rose-400/10',
          },
          {
            label: 'Rejected',
            value: rejectedCount,
            icon: XCircle,
            color: 'text-red-400',
            bg: 'bg-red-400/10',
          },
          {
            label: 'Avg. Quality Score',
            value: `${avgScore}%`,
            icon: BarChart3,
            color: scoreColor(avgScore),
            bg: scoreBg(avgScore).split(' ')[0],
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="card text-center py-5"
          >
            <div
              className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/40 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-white/40" /> Recent Reviews
        </h2>
        <div className="flex gap-2">
          {([
            { id: 'all' as const, label: 'All' },
            { id: 'approved' as const, label: 'Approved' },
            { id: 'rejected' as const, label: 'Rejected' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredReviews.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No reviews found</h3>
          <p className="text-sm text-white/40">
            {filterStatus === 'all'
              ? 'Applications will appear here once Sentinel reviews them.'
              : `No ${filterStatus} applications to show. Try a different filter.`}
          </p>
        </motion.div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {filteredReviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="card hover:border-white/10 transition-all"
            >
              {/* Review Header */}
              <button
                onClick={() => toggleExpand(review.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Score badge */}
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${scoreBg(
                        review.qualityScore
                      )}`}
                    >
                      <span className={`text-sm font-bold ${scoreColor(review.qualityScore)}`}>
                        {review.qualityScore}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-white text-sm truncate">
                          {review.jobTitle}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            review.status === 'approved'
                              ? 'bg-rose-400/10 text-rose-400 border-rose-400/20'
                              : 'bg-red-400/10 text-red-400 border-red-400/20'
                          }`}
                        >
                          {review.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                        <span className="font-medium text-white/60">{review.company}</span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Resume match: {review.resumeMatchPercent}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(review.reviewedAt)}
                        </span>
                      </div>

                      {/* Issues summary */}
                      {review.issues.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {review.issues.some((iss) => iss.type === 'error') && (
                            <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" />
                              {review.issues.filter((iss) => iss.type === 'error').length} error(s)
                            </span>
                          )}
                          {review.issues.some((iss) => iss.type === 'warning') && (
                            <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              {review.issues.filter((iss) => iss.type === 'warning').length} warning(s)
                            </span>
                          )}
                          {review.issues.some((iss) => iss.type === 'info') && (
                            <span className="flex items-center gap-1 text-[10px] text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              {review.issues.filter((iss) => iss.type === 'info').length} note(s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <div className="flex-shrink-0 text-white/30 mt-1">
                    {expandedId === review.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence initial={false}>
                {expandedId === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                      {/* Cover Letter Snippet */}
                      <div>
                        <h4 className="text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5" /> Cover Letter Preview
                        </h4>
                        <p className="text-sm text-white/40 leading-relaxed bg-white/[0.02] rounded-xl p-3 border border-white/5 italic">
                          &ldquo;{review.coverLetterSnippet}&rdquo;
                        </p>
                      </div>

                      {/* Issues Detail */}
                      <div>
                        <h4 className="text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Review Findings
                        </h4>
                        <div className="space-y-2">
                          {review.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm text-white/60 bg-white/[0.02] rounded-lg p-2.5 border border-white/5"
                            >
                              {issueIcon(issue.type)}
                              <span>{issue.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Score Breakdown Bar */}
                      <div>
                        <h4 className="text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" /> Quality Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/40">Quality Score</span>
                              <span className={scoreColor(review.qualityScore)}>
                                {review.qualityScore}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${review.qualityScore}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className={`h-full rounded-full ${
                                  review.qualityScore >= 80
                                    ? 'bg-rose-400'
                                    : review.qualityScore >= 60
                                    ? 'bg-yellow-400'
                                    : 'bg-red-400'
                                }`}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/40">Resume Match</span>
                              <span className={scoreColor(review.resumeMatchPercent)}>
                                {review.resumeMatchPercent}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${review.resumeMatchPercent}%` }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className={`h-full rounded-full ${
                                  review.resumeMatchPercent >= 80
                                    ? 'bg-rose-400'
                                    : review.resumeMatchPercent >= 60
                                    ? 'bg-yellow-400'
                                    : 'bg-red-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Result Count */}
      {filteredReviews.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-white/20 mt-6"
        >
          Showing {filteredReviews.length} of {totalReviews} reviews (demo data)
        </motion.p>
      )}
    </div>
  );
}
