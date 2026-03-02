'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Play, CheckCircle2, Clock, ExternalLink, Filter,
  Code, FileText, Lightbulb, TrendingUp, Star, ArrowRight, Zap
} from 'lucide-react';

const modules = [
  {
    id: '1', title: 'Python for ML Engineers', type: 'course' as const,
    provider: 'Fast.ai', url: 'https://fast.ai', duration: '10 hours',
    skills: ['Python', 'NumPy', 'Pandas'], progress: 100, isAdaptive: false,
    description: 'Strengthen Python fundamentals with a focus on data manipulation and ML workflows.',
  },
  {
    id: '2', title: 'Machine Learning Fundamentals', type: 'course' as const,
    provider: 'Coursera', url: 'https://coursera.org', duration: '20 hours',
    skills: ['ML Theory', 'Scikit-learn', 'Feature Engineering'], progress: 100, isAdaptive: true,
    description: 'Core ML concepts: regression, classification, clustering, and evaluation metrics.',
  },
  {
    id: '3', title: 'Deep Learning with PyTorch', type: 'course' as const,
    provider: 'PyTorch.org', url: 'https://pytorch.org', duration: '25 hours',
    skills: ['PyTorch', 'CNNs', 'RNNs'], progress: 65, isAdaptive: true,
    description: 'Hands-on deep learning covering neural networks, CNNs, RNNs, and training techniques.',
  },
  {
    id: '4', title: 'Build: Image Classification System', type: 'project' as const,
    provider: 'NXTED AI', duration: '15 hours',
    skills: ['PyTorch', 'Computer Vision', 'Model Evaluation'], progress: 40, isAdaptive: false,
    description: 'Build a production-quality image classifier with data augmentation and model optimization.',
  },
  {
    id: '5', title: 'Transformer Architecture Deep Dive', type: 'reading' as const,
    provider: 'Arxiv / Blog', duration: '4 hours',
    skills: ['Transformers', 'Attention', 'NLP'], progress: 20, isAdaptive: true,
    description: 'Understand the transformer architecture, self-attention, and modern NLP breakthroughs.',
  },
  {
    id: '6', title: 'LLM Fine-tuning Practice', type: 'practice' as const,
    provider: 'Hugging Face', url: 'https://huggingface.co', duration: '12 hours',
    skills: ['LLMs', 'Fine-tuning', 'LoRA'], progress: 0, isAdaptive: true,
    description: 'Practice fine-tuning large language models using PEFT techniques like LoRA and QLoRA.',
  },
  {
    id: '7', title: 'MLOps Fundamentals', type: 'course' as const,
    provider: 'MLOps Community', url: 'https://mlops.community', duration: '18 hours',
    skills: ['Docker', 'MLflow', 'CI/CD'], progress: 0, isAdaptive: false,
    description: 'Learn to deploy, version, and monitor ML models in production environments.',
  },
  {
    id: '8', title: 'Build: End-to-End ML Pipeline', type: 'project' as const,
    provider: 'NXTED AI', duration: '25 hours',
    skills: ['MLOps', 'Docker', 'API Design'], progress: 0, isAdaptive: false,
    description: 'Capstone project: build a complete ML pipeline from data ingestion to model serving.',
  },
];

const typeConfig = {
  course: { icon: Play, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
  project: { icon: Code, color: 'text-neon-green', bg: 'bg-neon-green/10' },
  reading: { icon: FileText, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
  practice: { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
};

export default function LearningPathPage() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? modules : modules.filter(m => m.type === filter);
  const totalProgress = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-neon-green" /> Adaptive Learning Path
        </h1>
        <p className="text-white/40">Personalized modules that adapt to your progress and skill gaps.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold gradient-text">{totalProgress}%</div>
          <div className="text-xs text-white/40">Overall Progress</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-neon-green">{modules.filter(m => m.progress === 100).length}/{modules.length}</div>
          <div className="text-xs text-white/40">Modules Complete</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-neon-purple">{modules.filter(m => m.isAdaptive).length}</div>
          <div className="text-xs text-white/40">AI-Adaptive Modules</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-white/30" />
        {['all', 'course', 'project', 'reading', 'practice'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {filtered.map((mod, i) => {
          const config = typeConfig[mod.type];
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card ${mod.progress > 0 && mod.progress < 100 ? 'border-neon-blue/20' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{mod.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{mod.description}</p>
                    </div>
                    {mod.isAdaptive && (
                      <span className="badge-neon text-[10px] flex-shrink-0">
                        <Zap className="w-2.5 h-2.5 mr-0.5" /> Adaptive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="text-xs text-white/30">{mod.provider}</span>
                    <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.duration}</span>
                    <div className="flex gap-1">
                      {mod.skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{s}</span>
                      ))}
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 skill-bar h-2">
                      <div className={`skill-bar-fill ${mod.progress === 100 ? 'bg-neon-green' : 'bg-neon-blue'}`} style={{ width: `${mod.progress}%` }} />
                    </div>
                    <span className="text-xs text-white/40 w-10 text-right">{mod.progress}%</span>
                    {mod.url && (
                      <a href={mod.url} target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
