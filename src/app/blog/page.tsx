import type { Metadata } from 'next';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = {
  title: 'Career Tips & AI Insights | jobTED AI Blog',
  description:
    'Explore career tips, resume writing advice, interview preparation strategies, and AI technology insights on the jobTED AI blog.',
};

export default function BlogPage() {
  return <BlogListClient />;
}
