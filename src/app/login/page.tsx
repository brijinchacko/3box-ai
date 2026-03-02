import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_SEO } from '@/lib/seo/keywords';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.login);

export default function LoginPage() {
  return <LoginPageClient />;
}
