import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Resume Builder | Create ATS-Optimized Resumes | 3BOX AI',
  description: 'Build a professional, ATS-optimized resume for free with AI. Choose from 4 templates, get AI-enhanced bullet points, and export as PDF. No sign-up required.',
  keywords: ['free resume builder', 'AI resume builder', 'ATS resume builder', 'resume maker', 'professional resume', 'resume templates', 'resume PDF'],
  openGraph: {
    title: 'Free AI Resume Builder | 3BOX AI',
    description: 'Create a professional ATS-optimized resume in minutes with AI. 4 templates, AI bullet points, free PDF export.',
    url: 'https://3box.ai/tools/resume-builder',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
