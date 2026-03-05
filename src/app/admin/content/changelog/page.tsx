'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Loader2, X } from 'lucide-react';

interface ChangelogEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string | null;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  feature: 'bg-neon-blue/15 text-neon-blue',
  improvement: 'bg-neon-purple/15 text-neon-purple',
  bugfix: 'bg-neon-green/15 text-neon-green',
  announcement: 'bg-amber-500/15 text-amber-400',
};

const categoryOptions = ['feature', 'improvement', 'bugfix', 'announcement'];

export default function AdminChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'feature', version: '', isPublic: true });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/changelog');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', category: 'feature', version: '', isPublic: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      version: entry.version || '',
      isPublic: entry.isPublic,
    });
    setEditId(entry.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editId ? `/api/admin/changelog/${editId}` : '/api/admin/changelog';
      const method = editId ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      resetForm();
      fetchEntries();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/admin/changelog/${id}`, { method: 'DELETE' });
    fetchEntries();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Changelog</h1>
          <p className="text-white/40 text-sm">{entries.length} entries</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="p-5 mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editId ? 'Edit Entry' : 'New Entry'}</h3>
            <button type="button" onClick={resetForm} className="p-1 text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />

          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Description of changes..."
            required
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
          />

          <div className="flex gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c} className="bg-surface">{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              placeholder="v1.2.0 (optional)"
              className="w-32 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-white/50">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                className="rounded"
              />
              Public
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
          </button>
        </motion.form>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No changelog entries yet.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium">{entry.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[entry.category] || 'bg-white/10 text-white/40'}`}>
                    {entry.category}
                  </span>
                  {entry.version && <span className="text-[10px] text-white/25">{entry.version}</span>}
                  <span className={`text-[10px] ${entry.isPublic ? 'text-neon-green/60' : 'text-white/20'}`}>
                    {entry.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(entry)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
