'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen, Plus, ExternalLink, Eye, Edit3, Code, Star,
  Globe, Github, CheckCircle2, Sparkles, Share2, Copy
} from 'lucide-react';

const demoProjects = [
  {
    id: '1', title: 'Real-time Recommendation Engine', description: 'Built a collaborative filtering + content-based hybrid recommendation system serving 2M+ users daily with sub-100ms latency.',
    skills: ['Python', 'PyTorch', 'Redis', 'FastAPI'], image: null, github: 'github.com/alex/rec-engine', live: 'demo.alexj.dev/rec',
    status: 'verified' as const, score: 92,
  },
  {
    id: '2', title: 'NLP Content Moderator', description: 'Transformer-based content moderation system achieving 96% accuracy on toxic content detection with multi-language support.',
    skills: ['PyTorch', 'Transformers', 'BERT', 'Docker'], image: null, github: 'github.com/alex/nlp-mod',
    status: 'verified' as const, score: 88,
  },
  {
    id: '3', title: 'MLOps Pipeline Framework', description: 'End-to-end ML pipeline with automated training, evaluation, deployment, and monitoring using MLflow and Kubernetes.',
    skills: ['MLflow', 'Kubernetes', 'Docker', 'CI/CD'], image: null, github: 'github.com/alex/mlops-pipe',
    status: 'in-progress' as const, score: null,
  },
  {
    id: '4', title: 'Open Source LLM Toolkit', description: 'Contributed to an open-source toolkit for LLM fine-tuning with LoRA/QLoRA techniques. 2K+ GitHub stars.',
    skills: ['Python', 'HuggingFace', 'LoRA', 'LLMs'], image: null, github: 'github.com/alex/llm-toolkit',
    status: 'verified' as const, score: 95,
  },
];

export default function PortfolioPage() {
  const [shareUrl] = useState('https://nxted.ai/p/alex-johnson');

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
              <FolderOpen className="w-7 h-7 text-neon-purple" /> Portfolio Builder
            </h1>
            <p className="text-white/40">Showcase your proof-of-work with a shareable portfolio.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button className="btn-primary text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" /> Publish
            </button>
          </div>
        </div>
      </motion.div>

      {/* Share URL */}
      <div className="card mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-neon-blue" />
          <div>
            <div className="text-sm font-medium">Portfolio URL</div>
            <div className="text-xs text-neon-blue">{shareUrl}</div>
          </div>
        </div>
        <button className="btn-ghost text-sm flex items-center gap-1">
          <Copy className="w-3 h-3" /> Copy Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Projects', value: demoProjects.length, color: 'text-neon-blue' },
          { label: 'Verified', value: demoProjects.filter(p => p.status === 'verified').length, color: 'text-neon-green' },
          { label: 'Avg Score', value: `${Math.round(demoProjects.filter(p => p.score).reduce((s, p) => s + (p.score || 0), 0) / demoProjects.filter(p => p.score).length)}`, color: 'text-neon-purple' },
          { label: 'Total Skills', value: [...new Set(demoProjects.flatMap(p => p.skills))].length, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {demoProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold group-hover:text-neon-blue transition-colors">{project.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {project.status === 'verified' && (
                    <span className="badge-green text-[10px]">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Verified
                    </span>
                  )}
                  {project.score && (
                    <span className="badge-neon text-[10px]">
                      <Star className="w-2.5 h-2.5 mr-0.5" /> {project.score}/100
                    </span>
                  )}
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>

            <p className="text-sm text-white/40 mb-4 line-clamp-2">{project.description}</p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1 mb-4">
              {project.skills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{s}</span>
              ))}
            </div>

            {/* Links */}
            <div className="flex items-center gap-3">
              {project.github && (
                <a href="#" className="text-xs text-white/40 hover:text-white flex items-center gap-1">
                  <Github className="w-3 h-3" /> GitHub
                </a>
              )}
              {project.live && (
                <a href="#" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Live Demo
                </a>
              )}
            </div>
          </motion.div>
        ))}

        {/* Add Project */}
        <button className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center py-12 text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
          <Plus className="w-8 h-8 mb-2" />
          <span className="text-sm">Add Project</span>
        </button>
      </div>
    </div>
  );
}
