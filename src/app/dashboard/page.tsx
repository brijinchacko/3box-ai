'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Target, BookOpen, FileText, Briefcase, TrendingUp,
  ArrowRight, BarChart3, Zap, Award, Clock, CheckCircle2,
  AlertCircle, Star
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

// Demo data
const careerTwin = {
  targetRole: 'AI Engineer',
  marketReadiness: 72,
  hireProbability: 0.68,
  topSkills: [
    { name: 'Python', score: 88, color: 'bg-neon-green' },
    { name: 'Machine Learning', score: 75, color: 'bg-neon-blue' },
    { name: 'Deep Learning', score: 62, color: 'bg-neon-purple' },
    { name: 'MLOps', score: 45, color: 'bg-neon-orange' },
    { name: 'System Design', score: 55, color: 'bg-neon-pink' },
  ],
};

const quickActions = [
  { icon: Brain, label: 'Take Assessment', href: '/dashboard/assessment', color: 'from-blue-500 to-cyan-400' },
  { icon: Target, label: 'View Career Plan', href: '/dashboard/career-plan', color: 'from-purple-500 to-pink-400' },
  { icon: FileText, label: 'Build Resume', href: '/dashboard/resume', color: 'from-green-500 to-emerald-400' },
  { icon: Briefcase, label: 'Find Jobs', href: '/dashboard/jobs', color: 'from-orange-500 to-yellow-400' },
];

const recentActivity = [
  { icon: CheckCircle2, text: 'Completed Python Advanced assessment', time: '2 hours ago', color: 'text-neon-green' },
  { icon: Star, text: 'Earned "Data Pipeline" project badge', time: '1 day ago', color: 'text-yellow-400' },
  { icon: TrendingUp, text: 'Market readiness increased to 72%', time: '2 days ago', color: 'text-neon-blue' },
  { icon: FileText, text: 'Updated resume for ML Engineer roles', time: '3 days ago', color: 'text-neon-purple' },
];

const milestones = [
  { title: 'Complete ML Fundamentals', progress: 100, status: 'completed' },
  { title: 'Build Portfolio Project #1', progress: 75, status: 'in-progress' },
  { title: 'System Design Practice', progress: 30, status: 'in-progress' },
  { title: 'MLOps Certification', progress: 0, status: 'upcoming' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back, Alex</h1>
        <p className="text-white/40">Your career journey to <span className="text-neon-blue font-medium">AI Engineer</span> — here&apos;s where you stand.</p>
      </motion.div>

      {/* Career Twin Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Market Readiness */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="card col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/60">Market Readiness</h3>
            <BarChart3 className="w-4 h-4 text-neon-blue" />
          </div>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="10"
                strokeDasharray={`${careerTwin.marketReadiness * 3.14} ${314 - careerTwin.marketReadiness * 3.14}`}
                strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{careerTwin.marketReadiness}%</span>
              <span className="text-[10px] text-white/40">READY</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/40">Hire Probability</div>
            <div className="text-lg font-bold text-neon-green">{Math.round(careerTwin.hireProbability * 100)}%</div>
          </div>
        </motion.div>

        {/* Skill Snapshot */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/60">Skill Snapshot — Career Twin</h3>
            <Link href="/dashboard/assessment" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
              Reassess <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {careerTwin.topSkills.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <span className="text-sm text-white/40">{skill.score}%</span>
                </div>
                <div className="skill-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.score}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`skill-bar-fill ${skill.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <motion.div key={action.label} custom={i + 2} variants={fadeUp} initial="hidden" animate="visible">
            <Link href={action.href} className="card-interactive flex flex-col items-center text-center py-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/60">Current Milestones</h3>
            <Link href="/dashboard/career-plan" className="text-xs text-neon-blue hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.title} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  m.status === 'completed' ? 'bg-neon-green/10' : m.status === 'in-progress' ? 'bg-neon-blue/10' : 'bg-white/5'
                }`}>
                  {m.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-neon-green" />
                  ) : m.status === 'in-progress' ? (
                    <Clock className="w-4 h-4 text-neon-blue" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-white/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.title}</div>
                  <div className="mt-1.5 skill-bar h-1.5">
                    <div
                      className={`skill-bar-fill ${m.status === 'completed' ? 'bg-neon-green' : 'bg-neon-blue'}`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">{m.progress}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="card">
          <h3 className="text-sm font-semibold text-white/60 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <activity.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activity.color}`} />
                <div>
                  <div className="text-sm">{activity.text}</div>
                  <div className="text-xs text-white/30 mt-0.5">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
