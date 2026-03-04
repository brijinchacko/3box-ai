import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_SEO } from '@/lib/seo/keywords';
import SignupPageClient from './SignupPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.signup);

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageClient />
    </Suspense>
  );
}
