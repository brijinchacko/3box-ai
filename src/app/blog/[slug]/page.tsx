import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Calendar, Clock, User, Share2, Mail, Send } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
  });
  return post;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Post Not Found | jobTED AI Blog' };
  }

  return {
    title: `${post.title} | jobTED AI Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const categoryLabels: Record<string, string> = {
    'career-tips': 'Career Tips',
    'resume-writing': 'Resume Writing',
    'interview-prep': 'Interview Prep',
    'ai-technology': 'AI & Technology',
    'industry-trends': 'Industry Trends',
  };

  const categoryColors: Record<string, string> = {
    'career-tips': 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20',
    'resume-writing': 'bg-neon-green/10 text-neon-green border border-neon-green/20',
    'interview-prep': 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20',
    'ai-technology': 'bg-neon-pink/10 text-neon-pink border border-neon-pink/20',
    'industry-trends': 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20',
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <article className="pt-32 pb-24 relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/5 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Category Badge */}
          <span
            className={`badge text-xs mb-4 inline-block ${
              categoryColors[post.category] || 'bg-white/10 text-white/60'
            }`}
          >
            {categoryLabels[post.category] || post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author + Date + Read Time */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/40 mb-10 pb-8 border-b border-white/5">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            {publishedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {publishedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime} min read
            </span>
          </div>

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-white/60 prose-p:leading-relaxed
              prose-a:text-neon-blue prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-ul:text-white/60 prose-ol:text-white/60
              prose-li:marker:text-neon-blue
              prose-blockquote:border-neon-blue/30 prose-blockquote:text-white/50
              prose-code:text-neon-green prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-surface-100 prose-pre:border prose-pre:border-white/5
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-white/40">
                <Share2 className="w-4 h-4" />
                Share this article
              </span>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                  title="Share on Twitter"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                  title="Share on LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                  title="Copy link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Related Posts Placeholder */}
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">Related Articles</h2>
            <div className="glass p-8 text-center">
              <p className="text-white/40">More articles coming soon</p>
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 card text-center">
            <Mail className="w-8 h-8 text-neon-blue mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Enjoyed this article?</h2>
            <p className="text-white/40 text-sm mb-6">
              Subscribe to get the latest career tips and AI insights delivered to your inbox.
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1"
              />
              <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <Send className="w-4 h-4" />
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
