'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Search, Trash2, Edit3, Eye, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  views: number;
  createdAt: string;
  publishedAt: string | null;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-400',
  PUBLISHED: 'bg-neon-green/15 text-neon-green',
  ARCHIVED: 'bg-white/10 text-white/40',
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-white/40 text-sm">{total} posts total</p>
        </div>
        <Link
          href="/admin/content/blog/new"
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </form>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          {['', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-sm">No posts found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{post.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[post.status] || ''}`}>
                    {post.status}
                  </span>
                  <span className="text-[10px] text-white/25">{post.category}</span>
                  <span className="text-[10px] text-white/25 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {post.views}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/content/blog/${post.id}/edit`}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 disabled:opacity-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/40">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 disabled:opacity-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
