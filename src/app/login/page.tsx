import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_SEO } from '@/lib/seo/keywords';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.login);

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <LoginPageClient />
    </Suspense>
  );
}
