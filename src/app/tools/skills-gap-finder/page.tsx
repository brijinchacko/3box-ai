import type { Metadata } from 'next';
import SkillsGapClient from './SkillsGapClient';

export const metadata: Metadata = {
  title: 'Skills Gap Finder | 3BOX AI',
  description:
    'Compare your resume against any job description to identify skill gaps, matched skills, and a prioritized learning plan.',
};

export default function SkillsGapFinderPage() {
  return <SkillsGapClient />;
}
