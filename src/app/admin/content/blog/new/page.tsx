'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const categories = [
  'career-tips', 'ai-tools', 'job-search', 'industry-insights',
  'resume-tips', 'interview-prep', 'skills-development',
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'career-tips',
    tags: '',
    status: 'DRAFT',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && !form.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      router.push('/admin/content/blog');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/content/blog"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Blog Post</h1>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/60 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => updateField('excerpt', e.target.value)}
            required
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Content</label>
          <textarea
            value={form.content}
            onChange={(e) => updateField('content', e.target.value)}
            required
            rows={16}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-y"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Cover Image URL</label>
          <input
            type="text"
            value={form.coverImage}
            onChange={(e) => updateField('coverImage', e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-surface">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
            >
              <option value="DRAFT" className="bg-surface">Draft</option>
              <option value="PUBLISHED" className="bg-surface">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            placeholder="career, ai, resume"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-sm flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Post'}
        </button>
      </form>
    </div>
  );
}
