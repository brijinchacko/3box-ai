import type { Metadata } from 'next';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = {
  title: 'Career Tips & AI Insights | 3BOX AI Blog',
  description:
    'Explore career tips, resume writing advice, interview preparation strategies, and AI technology insights on the 3BOX AI blog.',
};

export default function BlogPage() {
  return <BlogListClient />;
}
