'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, ExternalLink, Eye, Edit3, Code, Star,
  Globe, Github, CheckCircle2, Sparkles, Share2, Copy,
  Loader2, Wand2, Lightbulb, X, Save, Trash2, Upload,
  Mail, MapPin, Linkedin, ArrowUpRight
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

// ── Portfolio Theme Definitions ──────────────────────
type PortfolioTheme = 'midnight' | 'arctic' | 'sunset' | 'forest' | 'neon';

interface ThemeConfig {
  id: PortfolioTheme;
  name: string;
  desc: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent1: string;
  accent2: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  skillBg: string;
  skillBorder: string;
  skillText: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  divider: string;
  blob1: string;
  blob2: string;
  previewSwatch: string;
}

const PORTFOLIO_THEMES: ThemeConfig[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Dark bg, purple/blue gradient accents',
    bg: 'bg-[#0a0a0f]',
    cardBg: 'bg-white/[0.03]',
    cardBorder: 'border-white/[0.06]',
    cardHover: 'hover:border-[#a855f7]/20 hover:bg-white/[0.05]',
    textPrimary: 'text-white/90',
    textSecondary: 'text-white/60',
    textMuted: 'text-white/40',
    accent1: '#00d4ff',
    accent2: '#a855f7',
    gradientFrom: 'from-[#00d4ff]',
    gradientVia: 'via-[#a855f7]',
    gradientTo: 'to-[#00ff88]',
    skillBg: 'bg-white/[0.04]',
    skillBorder: 'border-white/[0.08]',
    skillText: 'text-white/50',
    tagBg: 'bg-[#a855f7]/10',
    tagBorder: 'border-[#a855f7]/10',
    tagText: 'text-[#a855f7]/60',
    divider: 'border-white/[0.06]',
    blob1: 'bg-[#a855f7]/5',
    blob2: 'bg-[#00d4ff]/5',
    previewSwatch: 'bg-gradient-to-br from-[#a855f7] to-[#00d4ff]',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    desc: 'Light/white bg, clean minimal, blue accents',
    bg: 'bg-[#f8fafc]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#e2e8f0]',
    cardHover: 'hover:border-[#3b82f6]/30 hover:shadow-md',
    textPrimary: 'text-[#0f172a]',
    textSecondary: 'text-[#475569]',
    textMuted: 'text-[#94a3b8]',
    accent1: '#3b82f6',
    accent2: '#0ea5e9',
    gradientFrom: 'from-[#3b82f6]',
    gradientVia: 'via-[#0ea5e9]',
    gradientTo: 'to-[#06b6d4]',
    skillBg: 'bg-[#f1f5f9]',
    skillBorder: 'border-[#e2e8f0]',
    skillText: 'text-[#475569]',
    tagBg: 'bg-[#3b82f6]/10',
    tagBorder: 'border-[#3b82f6]/20',
    tagText: 'text-[#3b82f6]',
    divider: 'border-[#e2e8f0]',
    blob1: 'bg-[#3b82f6]/5',
    blob2: 'bg-[#0ea5e9]/5',
    previewSwatch: 'bg-gradient-to-br from-[#f8fafc] to-[#3b82f6]',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    desc: 'Dark bg with warm orange/amber/gold gradients',
    bg: 'bg-[#0c0a09]',
    cardBg: 'bg-white/[0.03]',
    cardBorder: 'border-white/[0.06]',
    cardHover: 'hover:border-[#f59e0b]/20 hover:bg-white/[0.05]',
    textPrimary: 'text-white/90',
    textSecondary: 'text-white/60',
    textMuted: 'text-white/40',
    accent1: '#f59e0b',
    accent2: '#ef4444',
    gradientFrom: 'from-[#f59e0b]',
    gradientVia: 'via-[#ef4444]',
    gradientTo: 'to-[#ec4899]',
    skillBg: 'bg-white/[0.04]',
    skillBorder: 'border-white/[0.08]',
    skillText: 'text-white/50',
    tagBg: 'bg-[#f59e0b]/10',
    tagBorder: 'border-[#f59e0b]/10',
    tagText: 'text-[#f59e0b]/70',
    divider: 'border-white/[0.06]',
    blob1: 'bg-[#f59e0b]/5',
    blob2: 'bg-[#ef4444]/5',
    previewSwatch: 'bg-gradient-to-br from-[#f59e0b] to-[#ef4444]',
  },
  {
    id: 'forest',
    name: 'Forest',
    desc: 'Dark bg with green/emerald accents, nature feel',
    bg: 'bg-[#0a0f0c]',
    cardBg: 'bg-white/[0.03]',
    cardBorder: 'border-white/[0.06]',
    cardHover: 'hover:border-[#10b981]/20 hover:bg-white/[0.05]',
    textPrimary: 'text-white/90',
    textSecondary: 'text-white/60',
    textMuted: 'text-white/40',
    accent1: '#10b981',
    accent2: '#059669',
    gradientFrom: 'from-[#10b981]',
    gradientVia: 'via-[#059669]',
    gradientTo: 'to-[#14b8a6]',
    skillBg: 'bg-white/[0.04]',
    skillBorder: 'border-white/[0.08]',
    skillText: 'text-white/50',
    tagBg: 'bg-[#10b981]/10',
    tagBorder: 'border-[#10b981]/10',
    tagText: 'text-[#10b981]/70',
    divider: 'border-white/[0.06]',
    blob1: 'bg-[#10b981]/5',
    blob2: 'bg-[#059669]/5',
    previewSwatch: 'bg-gradient-to-br from-[#10b981] to-[#059669]',
  },
  {
    id: 'neon',
    name: 'Neon',
    desc: 'True black bg with bright neon cyan/pink accents',
    bg: 'bg-[#000000]',
    cardBg: 'bg-white/[0.02]',
    cardBorder: 'border-white/[0.05]',
    cardHover: 'hover:border-[#06b6d4]/30 hover:bg-white/[0.04]',
    textPrimary: 'text-white/95',
    textSecondary: 'text-white/60',
    textMuted: 'text-white/35',
    accent1: '#06b6d4',
    accent2: '#ec4899',
    gradientFrom: 'from-[#06b6d4]',
    gradientVia: 'via-[#ec4899]',
    gradientTo: 'to-[#8b5cf6]',
    skillBg: 'bg-white/[0.03]',
    skillBorder: 'border-white/[0.06]',
    skillText: 'text-white/50',
    tagBg: 'bg-[#06b6d4]/10',
    tagBorder: 'border-[#06b6d4]/15',
    tagText: 'text-[#06b6d4]/80',
    divider: 'border-white/[0.05]',
    blob1: 'bg-[#06b6d4]/5',
    blob2: 'bg-[#ec4899]/5',
    previewSwatch: 'bg-gradient-to-br from-[#06b6d4] to-[#ec4899]',
  },
];

// Helper: ensure URLs have protocol prefix
function ensureUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [userLinkedin, setUserLinkedin] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState<string | null>(null);
  const [suggestingProjects, setSuggestingProjects] = useState(false);
  const [suggestedProjects, setSuggestedProjects] = useState<{ title: string; description: string; skills: string[] }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({ title: '', description: '', skills: [], github: '', live: '', status: 'draft' });
  const [comingSoonMsg, setComingSoonMsg] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<PortfolioTheme>('midnight');

  // API integration state
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [portfolioSlug, setPortfolioSlug] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [portfolioTitle, setPortfolioTitle] = useState('My Portfolio');
  const [portfolioBio, setPortfolioBio] = useState('');
  const [portfolioSkills, setPortfolioSkills] = useState<string[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load portfolio from API on mount
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
          const data = await res.json();
          if (data.portfolio) {
            const p = data.portfolio;
            setPortfolioTitle(p.title || 'My Portfolio');
            setPortfolioBio(p.bio || '');
            setPortfolioSkills(Array.isArray(p.skills) ? p.skills : []);
            setPortfolioSlug(p.slug || null);
            setIsPublished(p.isPublic || false);
            // Load saved theme
            if (p.theme && PORTFOLIO_THEMES.some(t => t.id === p.theme)) {
              setSelectedTheme(p.theme as PortfolioTheme);
            }
            if (Array.isArray(p.projects) && p.projects.length > 0) {
              setProjects(p.projects);
            }
            if (p.user?.name) {
              setUserName(p.user.name);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load portfolio:', err);
        // Fallback: try localStorage for migration
        const stored = localStorage.getItem('nxted_portfolio_projects');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
            }
          } catch { /* ignore */ }
        }
      } finally {
        setLoadingPortfolio(false);
      }
    };
    loadPortfolio();
  }, []);

  // Fetch user profile for share URL and preview data
  useEffect(() => {
    if (!userName) {
      fetch('/api/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.name) setUserName(data.name);
          if (data?.email) setUserEmail(data.email);
          if (data?.location) setUserLocation(data.location);
          if (data?.linkedin) setUserLinkedin(data.linkedin);
        })
        .catch(() => {});
    }
  }, [userName]);

  const publicUrl = portfolioSlug
    ? `${window.location.origin}/p/${portfolioSlug}`
    : '';

  const shareUrl = publicUrl || (userName
    ? `https://nxted.ai/p/${userName.toLowerCase().replace(/\s+/g, '-')}`
    : '');

  const showComingSoon = (feature: string) => {
    setComingSoonMsg(`${feature} coming soon!`);
    setTimeout(() => setComingSoonMsg(''), 2000);
  };

  // Save portfolio to API
  const savePortfolioToAPI = useCallback(async (updatedProjects: Project[]) => {
    setSaving(true);
    try {
      const allSkills = [...new Set(updatedProjects.flatMap(p => p.skills))];
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: portfolioTitle,
          bio: portfolioBio,
          projects: updatedProjects,
          skills: allSkills,
          theme: selectedTheme,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.portfolio?.slug) {
          setPortfolioSlug(data.portfolio.slug);
        }
        if (data.portfolio?.isPublic) {
          setIsPublished(true);
        }
      }
    } catch (err) {
      console.error('Failed to save portfolio:', err);
    } finally {
      setSaving(false);
    }
  }, [portfolioTitle, portfolioBio, selectedTheme]);

  // Save projects: update state and debounce API save
  const saveProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    // Also update aggregated skills
    setPortfolioSkills([...new Set(updatedProjects.flatMap(p => p.skills))]);
    // Debounce API save to avoid rapid fire
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      savePortfolioToAPI(updatedProjects);
    }, 1000);
  }, [savePortfolioToAPI]);

  // Publish portfolio
  const publishPortfolio = async () => {
    // First ensure portfolio is saved
    setPublishing(true);
    try {
      // Save current state first
      const allSkills = [...new Set(projects.flatMap(p => p.skills))];
      await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: portfolioTitle,
          bio: portfolioBio,
          projects,
          skills: allSkills,
          theme: selectedTheme,
        }),
      });

      // Then publish
      const res = await fetch('/api/portfolio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolioSlug(data.slug);
        setIsPublished(true);
      } else {
        const data = await res.json();
        setComingSoonMsg(data.error || 'Failed to publish');
        setTimeout(() => setComingSoonMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to publish portfolio:', err);
      setComingSoonMsg('Failed to publish portfolio');
      setTimeout(() => setComingSoonMsg(''), 3000);
    } finally {
      setPublishing(false);
    }
  };

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
    const urlToCopy = publicUrl || shareUrl;
    navigator.clipboard.writeText(urlToCopy);
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
            {portfolioSlug && isPublished && (
              <a
                href={`/p/${portfolioSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Preview
              </a>
            )}
            <button
              onClick={publishPortfolio}
              disabled={publishing || projects.length === 0}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {isPublished ? 'Published' : 'Publish'}
            </button>
            {saving && (
              <span className="text-xs text-white/30 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab Switch */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'builder' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Edit3 className="w-4 h-4 inline mr-1" /> Builder
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Eye className="w-4 h-4 inline mr-1" /> Preview
        </button>
      </div>

      {/* ── Portfolio Preview Mode ── */}
      {activeTab === 'preview' && (() => {
        const theme = PORTFOLIO_THEMES.find(t => t.id === selectedTheme) || PORTFOLIO_THEMES[0];
        return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl overflow-hidden border border-white/10 ${theme.bg} min-h-[600px]`}
        >
          {/* Preview gradient background */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={`absolute top-0 left-1/4 w-[400px] h-[400px] ${theme.blob1} rounded-full blur-[100px]`} />
              <div className={`absolute bottom-0 right-1/4 w-[350px] h-[350px] ${theme.blob2} rounded-full blur-[100px]`} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 py-10 sm:py-16">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto mb-4"
                  style={{ background: `linear-gradient(135deg, ${theme.accent1}30, ${theme.accent2}30)` }}
                >
                  <span className="text-2xl font-bold" style={{ background: `linear-gradient(to right, ${theme.accent1}, ${theme.accent2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {userName?.charAt(0) || 'U'}
                  </span>
                </div>
                <h1 className={`text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientVia} ${theme.gradientTo} bg-clip-text text-transparent`}>
                  {userName || 'Your Name'}
                </h1>
                <p className={`${theme.textSecondary} text-base mb-3`}>{portfolioTitle || 'My Portfolio'}</p>
                {portfolioBio && <p className={`${theme.textMuted} max-w-xl mx-auto text-sm leading-relaxed`}>{portfolioBio}</p>}
                <div className={`flex items-center justify-center gap-4 mt-4 text-xs ${theme.textMuted}`}>
                  {userEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {userEmail}</span>}
                  {userLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {userLocation}</span>}
                  {userLinkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</span>}
                </div>
              </div>

              {/* Skills */}
              {portfolioSkills.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-4 h-4" style={{ color: theme.accent1 }} />
                    <h2 className={`text-sm font-semibold ${theme.textSecondary}`}>Skills</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {portfolioSkills.map(skill => (
                      <span key={skill} className={`px-3 py-1 rounded-full text-xs ${theme.skillBg} border ${theme.skillBorder} ${theme.skillText}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projects.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4" style={{ color: theme.accent2 }} />
                    <h2 className={`text-sm font-semibold ${theme.textSecondary}`}>Projects</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className={`rounded-xl ${theme.cardBg} border ${theme.cardBorder} p-5 ${theme.cardHover} transition-all`}
                      >
                        <h3 className={`font-semibold text-sm mb-1.5 ${theme.textPrimary}`}>{project.title}</h3>
                        <p className={`text-xs ${theme.textMuted} mb-3 line-clamp-2`}>{project.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.skills.map(s => (
                            <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${theme.tagBg} ${theme.tagText} border ${theme.tagBorder}`}>{s}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          {project.github && (
                            <span className={`text-[11px] ${theme.textMuted} flex items-center gap-1`}>
                              <Github className="w-3 h-3" /> GitHub
                            </span>
                          )}
                          {project.live && (
                            <span className="text-[11px] flex items-center gap-1" style={{ color: `${theme.accent1}99` }}>
                              <ArrowUpRight className="w-3 h-3" /> Live Demo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className={`w-12 h-12 ${theme.textMuted} mx-auto mb-3`} style={{ opacity: 0.3 }} />
                  <p className={`text-sm ${theme.textMuted}`}>No projects yet. Add projects in the Builder tab to see them here.</p>
                </div>
              )}

              {/* Footer */}
              <div className={`mt-12 pt-6 border-t ${theme.divider} text-center`}>
                <p className={`text-[10px] ${theme.textMuted}`} style={{ opacity: 0.4 }}>Built with NXTED AI</p>
              </div>
            </div>
          </div>
        </motion.div>
        );
      })()}

      {/* ── Builder Mode ── */}
      {activeTab === 'builder' && (<>
      {/* Coming Soon Toast */}
      <AnimatePresence>
        {comingSoonMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-2 rounded-xl bg-surface border border-white/10 text-sm text-white/70 shadow-lg"
          >
            {comingSoonMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Published URL */}
      {isPublished && portfolioSlug && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8 border border-neon-green/20 bg-gradient-to-r from-neon-green/5 to-transparent"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon-green" />
              <div>
                <div className="text-sm font-medium text-neon-green">Portfolio is Live!</div>
                <div className="text-xs text-white/50">{publicUrl}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/p/${portfolioSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> View
              </a>
              <button onClick={copyUrl} className="btn-ghost text-sm flex items-center gap-1">
                {copied ? <CheckCircle2 className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Share URL (when not yet published) */}
      {!isPublished && shareUrl && (
        <div className="card mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-neon-blue" />
            <div>
              <div className="text-sm font-medium">Portfolio URL</div>
              <div className="text-xs text-white/40">Publish your portfolio to get a shareable link</div>
            </div>
          </div>
          <button
            onClick={publishPortfolio}
            disabled={publishing || projects.length === 0}
            className="btn-primary text-xs flex items-center gap-1"
          >
            {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Publish Now
          </button>
        </div>
      )}

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

      {/* Portfolio Customization */}
      <div className="card mb-8">
        <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-neon-blue" /> Customize Portfolio
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">Portfolio Title</label>
            <input
              value={portfolioTitle}
              onChange={e => setPortfolioTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
              placeholder="My Portfolio"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Bio / Tagline</label>
            <input
              value={portfolioBio}
              onChange={e => setPortfolioBio(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
              placeholder="Full-stack developer passionate about building great products..."
            />
          </div>
        </div>
      </div>

      {/* Theme Picker */}
      <div className="card mb-8">
        <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neon-purple" /> Choose Theme
        </h3>
        <p className="text-xs text-white/30 mb-4">Select a visual theme for your portfolio. The theme will be applied to your public portfolio page.</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PORTFOLIO_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setSelectedTheme(theme.id);
                // Trigger a save with the new theme
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = setTimeout(() => {
                  savePortfolioToAPI(projects);
                }, 500);
              }}
              className={`relative p-3 rounded-xl border transition-all text-left ${
                selectedTheme === theme.id
                  ? 'border-neon-purple/50 bg-neon-purple/5 ring-1 ring-neon-purple/30'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className={`w-full h-8 rounded-lg mb-2 ${theme.previewSwatch}`} />
              <div className="text-xs font-medium text-white/80">{theme.name}</div>
              <div className="text-[10px] text-white/30 leading-tight">{theme.desc}</div>
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-neon-purple" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

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
                    <a href={ensureUrl(project.github)} target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white flex items-center gap-1">
                      <Github className="w-3 h-3" /> GitHub
                    </a>
                  )}
                  {project.live && (
                    <a href={ensureUrl(project.live)} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
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
                <input
                  value={newProject.live}
                  onChange={e => setNewProject({ ...newProject, live: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                  placeholder="Live Demo URL"
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
      </>)}
    </div>
  );
}
