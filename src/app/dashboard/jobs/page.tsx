'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Search, MapPin, DollarSign, TrendingUp, ExternalLink,
  Filter, CheckCircle2, Clock, XCircle, Send, Zap, Crown,
  ArrowRight, BarChart3, AlertCircle, Eye, Settings, Pause, Play
} from 'lucide-react';

const demoJobs = [
  {
    id: '1', title: 'Senior AI Engineer', company: 'Scale AI', location: 'San Francisco, CA',
    salary: '$180K - $250K', matchScore: 92, postedDate: '2 days ago',
    matchReasons: ['Strong ML/DL background', 'PyTorch expertise matches', 'System design experience'],
    improvementSteps: ['Get MLOps certification', 'Practice large-scale system design'],
  },
  {
    id: '2', title: 'ML Engineer', company: 'Stripe', location: 'Remote',
    salary: '$160K - $220K', matchScore: 87, postedDate: '1 day ago',
    matchReasons: ['Python proficiency', 'Production ML experience', 'Data pipeline skills'],
    improvementSteps: ['Strengthen fraud detection knowledge', 'Study financial ML use cases'],
  },
  {
    id: '3', title: 'AI Research Engineer', company: 'Anthropic', location: 'San Francisco, CA',
    salary: '$200K - $350K', matchScore: 78, postedDate: '3 days ago',
    matchReasons: ['Deep learning expertise', 'NLP experience', 'Open source contributions'],
    improvementSteps: ['Publish research paper', 'Deepen transformer architecture knowledge', 'Contribute to alignment research'],
  },
  {
    id: '4', title: 'Machine Learning Engineer', company: 'Netflix', location: 'Los Gatos, CA',
    salary: '$170K - $280K', matchScore: 85, postedDate: '5 days ago',
    matchReasons: ['Recommendation systems experience', 'Strong Python skills', 'Real-time ML experience'],
    improvementSteps: ['Study content-based filtering at scale'],
  },
];

const applications = [
  { id: '1', jobTitle: 'ML Engineer', company: 'OpenAI', status: 'interview' as const, appliedAt: '2 weeks ago', matchScore: 90 },
  { id: '2', jobTitle: 'AI Engineer', company: 'Google DeepMind', status: 'applied' as const, appliedAt: '1 week ago', matchScore: 82 },
  { id: '3', jobTitle: 'Senior ML Engineer', company: 'Meta', status: 'viewed' as const, appliedAt: '4 days ago', matchScore: 88 },
  { id: '4', jobTitle: 'Research Engineer', company: 'Cohere', status: 'queued' as const, appliedAt: null, matchScore: 79 },
];

const statusConfig = {
  queued: { color: 'text-white/40', bg: 'bg-white/5', icon: Clock, label: 'Queued' },
  applied: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', icon: Send, label: 'Applied' },
  viewed: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Eye, label: 'Viewed' },
  interview: { color: 'text-neon-green', bg: 'bg-neon-green/10', icon: CheckCircle2, label: 'Interview' },
  offer: { color: 'text-neon-purple', bg: 'bg-neon-purple/10', icon: Crown, label: 'Offer!' },
  rejected: { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle, label: 'Rejected' },
  withdrawn: { color: 'text-white/30', bg: 'bg-white/5', icon: XCircle, label: 'Withdrawn' },
};

export default function JobsPage() {
  const [tab, setTab] = useState<'discover' | 'applications' | 'automation'>('discover');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-neon-orange" /> Job Matching
        </h1>
        <p className="text-white/40">AI-powered job matching with explainable fit scoring.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'discover' as const, label: 'Discover Jobs', icon: Search },
          { id: 'applications' as const, label: 'Applications', icon: Send },
          { id: 'automation' as const, label: 'Auto-Apply', icon: Zap, badge: 'Ultra' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge && <span className="badge-purple text-[8px]">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <>
          {/* Search Bar */}
          <div className="card mb-6">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input className="input-field pl-10" placeholder="Search roles, companies..." />
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input className="input-field pl-10" placeholder="Location..." />
              </div>
              <button className="btn-primary text-sm">Search</button>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {demoJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card cursor-pointer"
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{job.title}</h3>
                      <div className={`badge text-xs ${
                        job.matchScore >= 90 ? 'bg-neon-green/10 text-neon-green' :
                        job.matchScore >= 80 ? 'bg-neon-blue/10 text-neon-blue' :
                        'bg-yellow-400/10 text-yellow-400'
                      }`}>
                        <TrendingUp className="w-3 h-3 mr-0.5" /> {job.matchScore}% match
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/40">
                      <span>{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                    </div>
                    <div className="text-xs text-white/30 mt-1">{job.postedDate}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Apply
                  </button>
                </div>

                {/* Expanded Match Details */}
                {expandedJob === job.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-white/5 grid sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-neon-green mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Why You Match
                      </h4>
                      {job.matchReasons.map((r, j) => (
                        <div key={j} className="text-sm text-white/50 mb-1 flex items-start gap-2">
                          <span className="text-neon-green mt-0.5">✓</span> {r}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> To Improve Your Chances
                      </h4>
                      {job.improvementSteps.map((s, j) => (
                        <div key={j} className="text-sm text-white/50 mb-1 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">→</span> {s}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {tab === 'applications' && (
        <div className="space-y-3">
          {applications.map((app, i) => {
            const config = statusConfig[app.status];
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{app.jobTitle}</h3>
                    <p className="text-xs text-white/40">{app.company} {app.appliedAt && `• Applied ${app.appliedAt}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge text-xs ${config.bg} ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-white/30">{app.matchScore}% match</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'automation' && (
        <div className="max-w-2xl mx-auto">
          <div className="card text-center mb-6">
            <Crown className="w-12 h-12 text-neon-purple mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ultra Auto-Apply Agent</h2>
            <p className="text-sm text-white/40 mb-6">Automatically apply to jobs matching your criteria with full audit trail and compliance controls.</p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Target Roles</label>
                <input className="input-field" placeholder="AI Engineer, ML Engineer..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Location</label>
                  <input className="input-field" placeholder="San Francisco, Remote..." />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Min Salary</label>
                  <input className="input-field" placeholder="$150,000" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Daily Cap</label>
                  <select className="input-field">
                    <option>5 applications / day</option>
                    <option>10 applications / day</option>
                    <option>20 applications / day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Exclusions</label>
                  <input className="input-field" placeholder="Companies to exclude..." />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/10 text-sm text-yellow-400/80 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>All automated actions are logged in a full audit trail. You can pause or stop at any time.</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start Auto-Apply
              </button>
              <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" /> Configure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
