'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, ExternalLink, Eye, Edit3, Code, Star,
  Globe, Github, CheckCircle2, Sparkles, Share2, Copy,
  Loader2, Wand2, Lightbulb, X, Save, Trash2
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  image: string | null;
  github: string;
  live: string;
  status: 'verified' | 'in-progress' | 'draft';
  score: number | null;
}

const defaultProjects: Project[] = [
  {
    id: '1', title: 'Real-time Recommendation Engine',
    description: 'Built a collaborative filtering + content-based hybrid recommendation system serving 2M+ users daily with sub-100ms latency.',
    skills: ['Python', 'PyTorch', 'Redis', 'FastAPI'], image: null, github: 'github.com/alex/rec-engine', live: 'demo.alexj.dev/rec',
    status: 'verified', score: 92,
  },
  {
    id: '2', title: 'NLP Content Moderator',
    description: 'Transformer-based content moderation system achieving 96% accuracy on toxic content detection with multi-language support.',
    skills: ['PyTorch', 'Transformers', 'BERT', 'Docker'], image: null, github: 'github.com/alex/nlp-mod', live: '',
    status: 'verified', score: 88,
  },
  {
    id: '3', title: 'MLOps Pipeline Framework',
    description: 'End-to-end ML pipeline with automated training, evaluation, deployment, and monitoring using MLflow and Kubernetes.',
    skills: ['MLflow', 'Kubernetes', 'Docker', 'CI/CD'], image: null, github: 'github.com/alex/mlops-pipe', live: '',
    status: 'in-progress', score: null,
  },
  {
    id: '4', title: 'Open Source LLM Toolkit',
    description: 'Contributed to an open-source toolkit for LLM fine-tuning with LoRA/QLoRA techniques. 2K+ GitHub stars.',
    skills: ['Python', 'HuggingFace', 'LoRA', 'LLMs'], image: null, github: 'github.com/alex/llm-toolkit', live: '',
    status: 'verified', score: 95,
  },
];

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [shareUrl] = useState('https://nxted.ai/p/alex-johnson');
  const [copied, setCopied] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState<string | null>(null);
  const [suggestingProjects, setSuggestingProjects] = useState(false);
  const [suggestedProjects, setSuggestedProjects] = useState<{ title: string; description: string; skills: string[] }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({ title: '', description: '', skills: [], github: '', live: '', status: 'draft' });

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('nxted_portfolio_projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          return;
        }
      } catch { /* ignore */ }
    }
    setProjects(defaultProjects);
  }, []);

  // Save projects to localStorage whenever they change
  const saveProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('nxted_portfolio_projects', JSON.stringify(updatedProjects));
  }, []);

  // AI Generate Project Description
  const generateDescription = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setGeneratingDesc(projectId);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a compelling, concise portfolio project description for a project titled "${project.title}" that uses these technologies: ${project.skills.join(', ')}. The current description is: "${project.description}". Make it more impactful with quantifiable results, action verbs, and technical depth. Keep it to 2-3 sentences. Return only the description text, no formatting or quotes.`,
          context: { targetRole: 'Software Engineer' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newDesc = data.response || project.description;
        const updated = projects.map(p =>
          p.id === projectId ? { ...p, description: newDesc } : p
        );
        saveProjects(updated);
      }
    } catch (err) {
      console.error('Failed to generate description:', err);
    } finally {
      setGeneratingDesc(null);
    }
  };

  // AI Suggest Projects
  const suggestProjects = async () => {
    setSuggestingProjects(true);
    setShowSuggestions(true);
    try {
      const allSkills = [...new Set(projects.flatMap(p => p.skills))];
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on these skills: ${allSkills.join(', ')}, and these existing projects: ${projects.map(p => p.title).join(', ')}, suggest 3 new portfolio projects that would strengthen this developer's profile. For each project, provide a title, a compelling description (2 sentences), and relevant skills. Return a JSON array: [{ "title": "...", "description": "...", "skills": ["..."] }]. Return ONLY the JSON array.`,
          context: { targetRole: 'Software Engineer' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          const responseText = data.response || '[]';
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
          setSuggestedProjects(parsed);
        } catch {
          setSuggestedProjects([
            { title: 'Real-time Data Dashboard', description: 'Build an interactive dashboard with real-time data streaming and visualization. Use WebSockets for live updates and D3.js for dynamic charts.', skills: ['React', 'WebSockets', 'D3.js', 'Node.js'] },
            { title: 'Microservices API Gateway', description: 'Design and implement an API gateway for microservices architecture with rate limiting, authentication, and service discovery.', skills: ['Node.js', 'Docker', 'Redis', 'Kong'] },
            { title: 'AI-Powered Code Review Tool', description: 'Create a tool that uses LLMs to automatically review pull requests and suggest improvements with explanations.', skills: ['Python', 'OpenAI API', 'GitHub API', 'FastAPI'] },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to suggest projects:', err);
      setSuggestedProjects([
        { title: 'Real-time Data Dashboard', description: 'Build an interactive dashboard with real-time data streaming and visualization.', skills: ['React', 'WebSockets', 'D3.js'] },
        { title: 'Microservices API Gateway', description: 'Design and implement an API gateway for microservices architecture.', skills: ['Node.js', 'Docker', 'Redis'] },
        { title: 'AI-Powered Code Review Tool', description: 'Create a tool that uses LLMs to automatically review pull requests.', skills: ['Python', 'OpenAI API', 'FastAPI'] },
      ]);
    } finally {
      setSuggestingProjects(false);
    }
  };

  // Add suggested project to portfolio
  const addSuggestedProject = (suggestion: { title: string; description: string; skills: string[] }) => {
    const newProj: Project = {
      id: Date.now().toString(),
      title: suggestion.title,
      description: suggestion.description,
      skills: suggestion.skills,
      image: null,
      github: '',
      live: '',
      status: 'draft',
      score: null,
    };
    saveProjects([...projects, newProj]);
    setSuggestedProjects(prev => prev.filter(s => s.title !== suggestion.title));
  };

  // Add new project
  const addNewProject = () => {
    if (!newProject.title) return;
    const proj: Project = {
      id: Date.now().toString(),
      title: newProject.title || '',
      description: newProject.description || '',
      skills: typeof newProject.skills === 'string'
        ? (newProject.skills as string).split(',').map(s => s.trim()).filter(Boolean)
        : (newProject.skills || []),
      image: null,
      github: newProject.github || '',
      live: newProject.live || '',
      status: 'draft',
      score: null,
    };
    saveProjects([...projects, proj]);
    setNewProject({ title: '', description: '', skills: [], github: '', live: '', status: 'draft' });
    setShowAddForm(false);
  };

  // Delete project
  const deleteProject = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
  };

  // Save edited project
  const saveEdit = (id: string) => {
    const updated = projects.map(p =>
      p.id === id ? { ...p, ...editForm } : p
    );
    saveProjects(updated);
    setEditingProject(null);
    setEditForm({});
  };

  // Copy share URL
  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifiedCount = projects.filter(p => p.status === 'verified').length;
  const scoredProjects = projects.filter(p => p.score);
  const avgScore = scoredProjects.length > 0
    ? Math.round(scoredProjects.reduce((s, p) => s + (p.score || 0), 0) / scoredProjects.length)
    : 0;
  const totalSkills = [...new Set(projects.flatMap(p => p.skills))].length;

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
            <button
              onClick={suggestProjects}
              disabled={suggestingProjects}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {suggestingProjects ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              AI Suggest Projects
            </button>
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
        <button onClick={copyUrl} className="btn-ghost text-sm flex items-center gap-1">
          {copied ? <CheckCircle2 className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* AI Suggested Projects */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <div className="card border border-neon-purple/20 bg-gradient-to-r from-neon-purple/5 to-neon-blue/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neon-purple" /> AI Suggested Projects
                </h3>
                <button onClick={() => setShowSuggestions(false)} className="text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {suggestingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neon-purple mr-3" />
                  <span className="text-sm text-white/50">Analyzing your skills and suggesting projects...</span>
                </div>
              ) : suggestedProjects.length > 0 ? (
                <div className="space-y-3">
                  {suggestedProjects.map((suggestion, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                        <p className="text-xs text-white/40 mb-2">{suggestion.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.skills.map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{s}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => addSuggestedProject(suggestion)}
                        className="btn-primary text-xs flex items-center gap-1 flex-shrink-0"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40 text-center py-4">No suggestions available. Try again later.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Projects', value: projects.length, color: 'text-neon-blue' },
          { label: 'Verified', value: verifiedCount, color: 'text-neon-green' },
          { label: 'Avg Score', value: avgScore > 0 ? `${avgScore}` : '--', color: 'text-neon-purple' },
          { label: 'Total Skills', value: totalSkills, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group"
          >
            {editingProject === project.id ? (
              /* Edit Mode */
              <div className="space-y-3">
                <input
                  value={editForm.title ?? project.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="Project title"
                />
                <textarea
                  value={editForm.description ?? project.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue h-20 resize-none"
                  placeholder="Project description"
                />
                <input
                  value={editForm.github ?? project.github}
                  onChange={e => setEditForm({ ...editForm, github: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="GitHub URL"
                />
                <input
                  value={editForm.live ?? project.live}
                  onChange={e => setEditForm({ ...editForm, live: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="Live demo URL"
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => saveEdit(project.id)} className="btn-primary text-xs flex items-center gap-1">
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => { setEditingProject(null); setEditForm({}); }} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button onClick={() => { deleteProject(project.id); setEditingProject(null); }} className="btn-ghost text-xs text-red-400 hover:text-red-300 ml-auto flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <>
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
                      {project.status === 'draft' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">Draft</span>
                      )}
                      {project.score && (
                        <span className="badge-neon text-[10px]">
                          <Star className="w-2.5 h-2.5 mr-0.5" /> {project.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingProject(project.id); setEditForm({}); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>

                <p className="text-sm text-white/40 mb-4 line-clamp-2">{project.description}</p>

                {/* AI Generate Description Button */}
                <button
                  onClick={() => generateDescription(project.id)}
                  disabled={generatingDesc === project.id}
                  className="mb-4 text-xs text-neon-purple hover:text-neon-purple/80 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {generatingDesc === project.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      AI Enhance Description
                    </>
                  )}
                </button>

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
              </>
            )}
          </motion.div>
        ))}

        {/* Add Project Button / Form */}
        <AnimatePresence mode="wait">
          {showAddForm ? (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-neon-blue" /> Add New Project
              </h3>
              <div className="space-y-3">
                <input
                  value={newProject.title}
                  onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="Project title"
                />
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue h-20 resize-none"
                  placeholder="Project description"
                />
                <input
                  value={Array.isArray(newProject.skills) ? newProject.skills.join(', ') : newProject.skills}
                  onChange={e => setNewProject({ ...newProject, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="Skills (comma-separated)"
                />
                <input
                  value={newProject.github}
                  onChange={e => setNewProject({ ...newProject, github: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="GitHub URL"
                />
                <div className="flex items-center gap-2">
                  <button onClick={addNewProject} className="btn-primary text-xs flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="btn-secondary text-xs">Cancel</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(true)}
              className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center py-12 text-white/30 hover:text-white/50 hover:border-white/20 transition-all"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="text-sm">Add Project</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
