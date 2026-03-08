import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import TeacherClient from './TeacherClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'AI Resume Builder for Teachers | ATS-Optimized Education Resumes | jobTED AI',
  description:
    'Build an ATS-optimized teacher resume with AI. Highlight your classroom experience, teaching certifications, curriculum development, and student achievement data. Tailored for K-12, higher education, and special education. Free to start.',
  keywords:
    'AI resume builder for teachers, teacher resume builder, education resume template, ATS resume for teachers, teaching resume tips, K-12 resume builder, educator resume AI, special education resume, teacher certification resume, teaching resume 2026',
  canonical: '/resume/teacher',
});

const faqData = [
  {
    question: 'What should a teacher resume include?',
    answer:
      'A teacher resume should include your teaching certifications and endorsements, education (degree type and institution), teaching experience with grade levels and subjects, classroom management approach, curriculum development experience, student achievement data, technology integration skills (Google Classroom, Canvas, Smartboard), and professional development activities.',
  },
  {
    question: 'How do I pass ATS as a teacher?',
    answer:
      'School district ATS systems like Frontline Education, AppliTrack, and TalentEd search for specific education terms. Include your exact certification type, subject endorsements, grade levels, teaching methods (differentiated instruction, project-based learning), and ed-tech tools. jobTED AI identifies missing education keywords and suggests additions.',
  },
  {
    question: 'Should I use AI to write my teacher resume?',
    answer:
      'Yes. AI resume builders like jobTED AI understand education terminology, state certification requirements, and what hiring principals look for. The AI helps you articulate student outcomes, curriculum innovations, and classroom management strategies in a way that passes district ATS filters and impresses interview committees.',
  },
  {
    question: 'How do I quantify teaching achievements on a resume?',
    answer:
      'Focus on measurable student outcomes: "Improved standardized test scores by 22% across 120 students," "Achieved 95% student proficiency rate in state math assessment," "Reduced chronic absenteeism by 18% through parent engagement program," or "Mentored 8 student teachers over 4 years, all of whom received full-time offers."',
  },
  {
    question: 'What resume format is best for teachers?',
    answer:
      'Use a reverse-chronological format with a "Certifications & Endorsements" section near the top. Include a professional summary highlighting your teaching philosophy, years of experience, and subject expertise. List each position with school name, district, grade levels, subjects, and class sizes. New teachers should emphasize student teaching and practicum experience.',
  },
  {
    question: 'Should I include a teaching philosophy on my resume?',
    answer:
      'Include a brief 2-3 sentence professional summary that reflects your teaching philosophy, not a separate section. Save the detailed teaching philosophy statement for your application portfolio. Your summary might read: "Student-centered educator with 8 years of experience in differentiated instruction for diverse learners, committed to project-based learning and social-emotional development."',
  },
];

export default function TeacherResumePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'jobTED AI Resume Builder for Teachers',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'AI-powered resume builder designed for teachers and educators. Optimizes teaching resumes for school district ATS systems and highlights certifications, student outcomes, and classroom experience.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free AI resume builder with ATS optimization for teachers',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '876',
              bestRating: '5',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(SCHEMA_ORG.faqPage(faqData)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            SCHEMA_ORG.breadcrumb([
              { name: 'Home', url: 'https://jobted.ai' },
              { name: 'Resume Builder', url: 'https://jobted.ai/resume' },
              { name: 'Teacher', url: 'https://jobted.ai/resume/teacher' },
            ])
          ),
        }}
      />
      <TeacherClient />
    </>
  );
}
