'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp, Building2, DollarSign, Briefcase, Sparkles,
  ArrowRight, Zap, Shield, Target, BadgeCheck,
} from 'lucide-react';

export interface ResumeInsightsData {
  salary: {
    low: number;
    median: number;
    high: number;
    currency: string;
    growthRate: number;
  };
  market: {
    demandLevel: 'high' | 'medium' | 'low';
    marketTrend: 'growing' | 'stable' | 'declining';
    topCompanies: string[];
    matchingRoles: string[];
  };
  insights: {
    keyInsight: string;
    resumeStrength: string;
    forgeRecommendation: string;
    topSkillGaps: string[];
    competitiveEdge: string;
  };
}

interface ResumeInsightsPanelProps {
  data: ResumeInsightsData;
  targetRole: string;
  location: string;
  onContinue: () => void;
}

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

const demandColors = {
  high: { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/20', label: 'High Demand' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Moderate Demand' },
  low: { bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/20', label: 'Lower Demand' },
};

const trendIcons = {
  growing: { icon: TrendingUp, color: 'text-neon-green', label: 'Growing' },
  stable: { icon: Target, color: 'text-amber-400', label: 'Stable' },
  declining: { icon: TrendingUp, color: 'text-red-400', label: 'Declining' },
};

export default function ResumeInsightsPanel({
  data,
  targetRole,
  location,
  onContinue,
}: ResumeInsightsPanelProps) {
  const demand = demandColors[data.market.demandLevel];
  const trend = trendIcons[data.market.marketTrend];
  const TrendIcon = trend.icon;

  const stagger = {
    container: { transition: { staggerChildren: 0.08 } },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger.container}
      className="space-y-3"
    >
      {/* ── Header: Key Insight ── */}
      <motion.div
        variants={stagger.item}
        className="p-4 rounded-2xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/5 border border-neon-blue/15"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-neon-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1">Your Career Market Snapshot</h3>
            <p className="text-xs text-white/60 leading-relaxed">{data.insights.keyInsight}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Row 1: Salary + Demand + Trend ── */}
      <motion.div variants={stagger.item} className="grid grid-cols-3 gap-2">
        {/* Salary */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-neon-green" />
            <span className="text-[10px] text-white/40 font-medium">Avg Salary</span>
          </div>
          <div className="text-lg font-bold text-white">{formatSalary(data.salary.median)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">
            {formatSalary(data.salary.low)} – {formatSalary(data.salary.high)}
          </div>
        </div>

        {/* Demand Level */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-[10px] text-white/40 font-medium">Demand</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${demand.bg} ${demand.text} border ${demand.border}`}>
            {demand.label}
          </span>
        </div>

        {/* Growth Trend */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-white/40 font-medium">Growth</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon className={`w-4 h-4 ${trend.color}`} />
            <span className={`text-sm font-bold ${trend.color}`}>+{data.salary.growthRate}%</span>
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">{trend.label}</div>
        </div>
      </motion.div>

      {/* ── Matching Roles ── */}
      {data.market.matchingRoles.length > 0 && (
        <motion.div variants={stagger.item} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <BadgeCheck className="w-3.5 h-3.5 text-neon-blue" />
            <span className="text-[10px] text-white/40 font-medium">Roles You Qualify For</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.market.matchingRoles.slice(0, 5).map((role) => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-full bg-neon-blue/8 border border-neon-blue/15 text-[11px] text-neon-blue/90 font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Top Companies Hiring ── */}
      {data.market.topCompanies.length > 0 && (
        <motion.div variants={stagger.item} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-[10px] text-white/40 font-medium">
              Top Companies Hiring {targetRole}s{location ? ` near ${location}` : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.market.topCompanies.slice(0, 5).map((company) => (
              <span
                key={company}
                className="px-2 py-0.5 rounded-full bg-neon-purple/8 border border-neon-purple/15 text-[11px] text-neon-purple/90 font-medium"
              >
                {company}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Skill Gaps ── */}
      {data.insights.topSkillGaps.length > 0 && (
        <motion.div variants={stagger.item} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-amber-400/80 font-medium">Skills to Develop</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.insights.topSkillGaps.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-[11px] text-amber-400/80 font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Forge CTA ── */}
      <motion.div
        variants={stagger.item}
        className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/15"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4.5 h-4.5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-orange-400 mb-0.5">Agent Forge Can Help</h4>
            <p className="text-[11px] text-white/50 leading-relaxed">
              {data.insights.forgeRecommendation}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Competitive Edge ── */}
      {data.insights.competitiveEdge && (
        <motion.div variants={stagger.item} className="px-3 py-2 rounded-xl bg-neon-green/5 border border-neon-green/10">
          <p className="text-[11px] text-neon-green/80 flex items-start gap-1.5">
            <span className="text-neon-green mt-px">✦</span>
            <span>{data.insights.competitiveEdge}</span>
          </p>
        </motion.div>
      )}

      {/* ── Continue Button ── */}
      <motion.button
        variants={stagger.item}
        onClick={onContinue}
        className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
      >
        Continue to Complete Profile <ArrowRight className="w-4 h-4" />
      </motion.button>

      <motion.p variants={stagger.item} className="text-center text-[10px] text-white/20">
        Your 6 AI agents are ready — let&apos;s finish setting up your profile
      </motion.p>
    </motion.div>
  );
}
