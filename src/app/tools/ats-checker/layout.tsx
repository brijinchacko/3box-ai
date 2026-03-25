import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker | Score Your Resume Against ATS Systems | 3BOX AI',
  description: 'Check your resume against ATS (Applicant Tracking Systems) for free. Get an instant ATS compatibility score, keyword analysis, and actionable suggestions to improve your resume.',
  keywords: ['ATS checker', 'ATS resume checker', 'free ATS score', 'resume ATS compatibility', 'applicant tracking system', 'ATS-friendly resume', 'resume scanner'],
  openGraph: {
    title: 'Free ATS Resume Checker | 3BOX AI',
    description: 'Instantly check your resume against ATS systems. Get a score and actionable tips to pass ATS filters.',
    url: 'https://3box.ai/tools/ats-checker',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
