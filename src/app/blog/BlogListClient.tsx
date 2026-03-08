'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Send, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  author: string;
  readTime: number;
  publishedAt: string | null;
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'career-tips', label: 'Career Tips' },
  { key: 'resume-writing', label: 'Resume Writing' },
  { key: 'interview-prep', label: 'Interview Prep' },
  { key: 'ai-technology', label: 'AI & Technology' },
  { key: 'industry-trends', label: 'Industry Trends' },
];

const categoryColors: Record<string, string> = {
  'career-tips': 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20',
  'resume-writing': 'bg-neon-green/10 text-neon-green border border-neon-green/20',
  'interview-prep': 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20',
  'ai-technology': 'bg-neon-pink/10 text-neon-pink border border-neon-pink/20',
  'industry-trends': 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20',
};

const categoryGradients: Record<string, string> = {
  'career-tips': 'from-neon-blue/20 to-neon-purple/20',
  'resume-writing': 'from-neon-green/20 to-neon-blue/20',
  'interview-prep': 'from-neon-purple/20 to-neon-pink/20',
  'ai-technology': 'from-neon-pink/20 to-neon-orange/20',
  'industry-trends': 'from-neon-orange/20 to-neon-blue/20',
};

function formatCategoryLabel(key: string) {
  const map: Record<string, string> = {
    'career-tips': 'Career Tips',
    'resume-writing': 'Resume Writing',
    'interview-prep': 'Interview Prep',
    'ai-technology': 'AI & Technology',
    'industry-trends': 'Industry Trends',
  };
  return map[key] || key;
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-40 rounded-xl bg-white/5 mb-4" />
      <div className="h-4 w-24 rounded bg-white/5 mb-3" />
      <div className="h-6 w-3/4 rounded bg-white/5 mb-2" />
      <div className="h-4 w-full rounded bg-white/5 mb-1" />
      <div className="h-4 w-2/3 rounded bg-white/5 mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-white/5" />
        <div className="h-3 w-16 rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeCategory !== 'all') {
          params.set('category', activeCategory);
        }
        params.set('limit', '50');
        const res = await fetch(`/api/blog?${params.toString()}`);
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [activeCategory]);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail, source: 'blog' }),
      });
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
      }
    } catch {
      setNewsletterStatus('error');
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold mb-4"
          >
            3BOX AI <span className="gradient-text">Blog</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 max-w-xl mx-auto text-lg"
          >
            Career tips, AI insights, and industry trends
          </motion.p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Blog Grid */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-white/40 text-lg mb-2">No posts found</p>
            <p className="text-white/20 text-sm">
              {activeCategory !== 'all'
                ? 'Try a different category or check back later.'
                : 'Blog posts are coming soon. Stay tuned!'}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/blog/${post.slug}`} className="block group">
                  <div className="card h-full flex flex-col hover:border-white/20 transition-all duration-300">
                    {/* Cover Image Placeholder */}
                    <div
                      className={`h-40 rounded-xl mb-4 bg-gradient-to-br ${
                        categoryGradients[post.category] || 'from-white/5 to-white/10'
                      } flex items-center justify-center overflow-hidden`}
                    >
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl opacity-30">3BOX</span>
                      )}
                    </div>

                    {/* Category Badge */}
                    <span
                      className={`badge text-[10px] mb-3 w-fit ${
                        categoryColors[post.category] || 'bg-white/10 text-white/60'
                      }`}
                    >
                      {formatCategoryLabel(post.category)}
                    </span>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-neon-blue transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-white/40 mb-4 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min read
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neon-blue font-medium group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="relative pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card text-center"
          >
            <h2 className="text-2xl font-bold mb-2">Subscribe to our newsletter</h2>
            <p className="text-white/40 text-sm mb-6">
              Get the latest career tips and AI insights delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="input-field flex-1"
                required
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {newsletterStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Subscribe
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="text-neon-green text-sm mt-3">Successfully subscribed!</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-red-400 text-sm mt-3">Something went wrong. Please try again.</p>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
