'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Target, CheckCircle2, Clock, Lock, ArrowRight, ChevronDown,
  ChevronUp, Code, BookOpen, Briefcase, Award, TrendingUp,
  Calendar, Zap, BarChart3
} from 'lucide-react';

const milestones = [
  {
    id: '1',
    title: 'Foundation: Python & ML Basics',
    description: 'Strengthen core Python and machine learning fundamentals',
    duration: '2 weeks',
    status: 'completed' as const,
    skills: ['Python', 'NumPy', 'Pandas', 'Scikit-learn'],
    projects: [
      { title: 'Data Analysis Pipeline', status: 'completed', hours: 8, score: 92 },
      { title: 'Classification Model', status: 'completed', hours: 12, score: 88 },
    ],
  },
  {
    id: '2',
    title: 'Deep Learning & Neural Networks',
    description: 'Master deep learning concepts, frameworks, and architectures',
    duration: '3 weeks',
    status: 'in-progress' as const,
    skills: ['PyTorch', 'TensorFlow', 'CNNs', 'Transformers'],
    projects: [
      { title: 'Image Classifier (CNN)', status: 'completed', hours: 15, score: 85 },
      { title: 'NLP Sentiment Analyzer', status: 'in-progress', hours: 20, score: null },
      { title: 'Fine-tune LLM', status: 'not-started', hours: 25, score: null },
    ],
  },
  {
    id: '3',
    title: 'MLOps & Production Systems',
    description: 'Learn to deploy, monitor, and maintain ML systems in production',
    duration: '3 weeks',
    status: 'upcoming' as const,
    skills: ['Docker', 'MLflow', 'Kubeflow', 'CI/CD'],
    projects: [
      { title: 'ML Pipeline with MLflow', status: 'not-started', hours: 20, score: null },
      { title: 'Model Serving API', status: 'not-started', hours: 15, score: null },
    ],
  },
  {
    id: '4',
    title: 'System Design for ML',
    description: 'Design scalable ML systems and architecture patterns',
    duration: '2 weeks',
    status: 'upcoming' as const,
    skills: ['System Design', 'Distributed Systems', 'API Design'],
    projects: [
      { title: 'Design: Real-time Recommendation Engine', status: 'not-started', hours: 10, score: null },
      { title: 'Design: Fraud Detection System', status: 'not-started', hours: 10, score: null },
    ],
  },
  {
    id: '5',
    title: 'Portfolio & Job Preparation',
    description: 'Finalize portfolio, optimize resume, and prepare for interviews',
    duration: '2 weeks',
    status: 'upcoming' as const,
    skills: ['Portfolio', 'Resume', 'Interview Skills'],
    projects: [
      { title: 'Capstone: End-to-end ML Project', status: 'not-started', hours: 40, score: null },
      { title: 'Mock Interview Series', status: 'not-started', hours: 8, score: null },
    ],
  },
];

const statusConfig = {
  completed: { color: 'bg-neon-green', textColor: 'text-neon-green', icon: CheckCircle2, label: 'Completed' },
  'in-progress': { color: 'bg-neon-blue', textColor: 'text-neon-blue', icon: Clock, label: 'In Progress' },
  upcoming: { color: 'bg-white/20', textColor: 'text-white/40', icon: Lock, label: 'Upcoming' },
  'not-started': { color: 'bg-white/10', textColor: 'text-white/30', icon: Lock, label: 'Not Started' },
};

export default function CareerPlanPage() {
  const [expanded, setExpanded] = useState<string | null>('2');

  const totalProjects = milestones.reduce((sum, m) => sum + m.projects.length, 0);
  const completedProjects = milestones.reduce((sum, m) => sum + m.projects.filter(p => p.status === 'completed').length, 0);
  const overallProgress = Math.round((completedProjects / totalProjects) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Target className="w-7 h-7 text-neon-purple" /> Career Plan
        </h1>
        <p className="text-white/40">Your personalized roadmap to becoming an <span className="text-neon-blue">AI Engineer</span></p>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Overall Progress', value: `${overallProgress}%`, icon: BarChart3, color: 'text-neon-blue' },
          { label: 'Projects Done', value: `${completedProjects}/${totalProjects}`, icon: Code, color: 'text-neon-green' },
          { label: 'Est. Completion', value: '12 weeks', icon: Calendar, color: 'text-neon-purple' },
          { label: 'Proof Score', value: '340 pts', icon: Award, color: 'text-yellow-400' },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Journey Progress</span>
          <span className="text-sm text-white/40">{overallProgress}% complete</span>
        </div>
        <div className="skill-bar h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.5 }}
            className="skill-bar-fill bg-gradient-to-r from-neon-blue to-neon-purple"
          />
        </div>
      </div>

      {/* Timeline Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, i) => {
          const config = statusConfig[milestone.status];
          const isExpanded = expanded === milestone.id;

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Timeline line */}
              {i < milestones.length - 1 && (
                <div className={`absolute left-6 top-16 bottom-0 w-px ${milestone.status === 'completed' ? 'bg-neon-green/30' : 'bg-white/5'}`} />
              )}

              <div
                className={`card cursor-pointer ${milestone.status === 'in-progress' ? 'border-neon-blue/20 neon-glow' : ''}`}
                onClick={() => setExpanded(isExpanded ? null : milestone.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    milestone.status === 'completed' ? 'bg-neon-green/10' :
                    milestone.status === 'in-progress' ? 'bg-neon-blue/10' : 'bg-white/5'
                  }`}>
                    <config.icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{milestone.title}</h3>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                    <p className="text-sm text-white/40 mt-1">{milestone.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`badge text-[10px] ${config.color}/10 ${config.textColor}`}>{config.label}</span>
                      <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {milestone.duration}</span>
                      <div className="flex gap-1">
                        {milestone.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{s}</span>
                        ))}
                        {milestone.skills.length > 3 && <span className="text-[10px] text-white/30">+{milestone.skills.length - 3}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded: Projects */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-white/5"
                  >
                    <h4 className="text-sm font-semibold text-white/60 mb-4">Proof-of-Work Projects</h4>
                    <div className="space-y-3">
                      {milestone.projects.map((project) => {
                        const pConfig = statusConfig[project.status as keyof typeof statusConfig] || statusConfig['not-started'];
                        return (
                          <div key={project.title} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                            <div className="flex items-center gap-3">
                              <pConfig.icon className={`w-4 h-4 ${pConfig.textColor}`} />
                              <div>
                                <div className="text-sm font-medium">{project.title}</div>
                                <div className="text-xs text-white/30">{project.hours}h estimated</div>
                              </div>
                            </div>
                            <div className="text-right">
                              {project.score ? (
                                <div className="text-sm font-bold text-neon-green">{project.score}/100</div>
                              ) : (
                                <span className={`text-xs ${pConfig.textColor}`}>{pConfig.label}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard/learning" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
          Start Learning Path <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/dashboard/assessment" className="btn-secondary flex-1 text-center">
          Reassess Skills
        </Link>
      </div>
    </div>
  );
}
