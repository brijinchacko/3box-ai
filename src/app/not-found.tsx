import Link from 'next/link';
import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'Page Not Found — 3BOX AI',
  description: 'The page you are looking for does not exist. Explore 3BOX AI tools, case studies, or get started with your AI career journey.',
  keywords: '404, page not found, 3BOX AI',
  canonical: '/404',
});

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-white/10 mb-2">404</p>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-white/50 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary text-sm px-6 py-2.5">
            Go Home
          </Link>
          <Link href="/tools" className="btn-secondary text-sm px-6 py-2.5">
            Explore AI Tools
          </Link>
          <Link href="/get-started" className="btn-ghost text-sm px-6 py-2.5">
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
