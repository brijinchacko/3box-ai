import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import NurseClient from './NurseClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'AI Resume Builder for Nurses | ATS-Optimized Nursing Resumes | NXTED AI',
  description:
    'Build an ATS-optimized nursing resume with AI. Highlight your clinical experience, certifications (RN, BSN, ACLS, BLS), and patient care achievements. Tailored for hospitals, clinics, and travel nursing. Free to start.',
  keywords:
    'AI resume builder for nurses, nursing resume builder, RN resume template, ATS resume for nurses, nurse resume tips, BSN resume builder, clinical nursing resume, healthcare resume AI, travel nurse resume, nursing resume 2026',
  canonical: '/resume/nurse',
});

const faqData = [
  {
    question: 'What should a nursing resume include?',
    answer:
      'A nursing resume should include your nursing license and certifications (RN, BSN, MSN, ACLS, BLS, PALS), clinical specializations, patient care experience with unit types and bed counts, EMR/EHR proficiency (Epic, Cerner, Meditech), education from accredited nursing programs, and any clinical leadership or preceptor experience.',
  },
  {
    question: 'How do I pass ATS as a nurse?',
    answer:
      'Hospital ATS systems like Taleo, Workday, and iCIMS search for specific nursing terms. Include your exact license type (RN, LPN, NP), specialty certifications, EMR systems you have used, clinical procedures, and unit types (ICU, ER, Med-Surg, L&D). NXTED AI auto-detects missing nursing keywords and suggests additions.',
  },
  {
    question: 'Should I use AI to write my nursing resume?',
    answer:
      'Yes. AI resume builders like NXTED AI understand healthcare terminology, HIPAA compliance language, and what nursing recruiters look for. The AI helps you articulate patient outcomes, leadership experience, and clinical skills in a way that passes ATS filters used by hospital systems and staffing agencies.',
  },
  {
    question: 'How do I highlight certifications on a nursing resume?',
    answer:
      'Place your most relevant certifications immediately after your name in the header (e.g., "Jane Smith, RN, BSN, CCRN"). Create a dedicated "Licenses & Certifications" section near the top listing each credential with its issuing body and expiration date. Include specialty certifications like CCRN, CEN, or CNOR prominently.',
  },
  {
    question: 'What resume format is best for nurses?',
    answer:
      'Reverse-chronological format works best for most nurses. Include a clinical summary at the top highlighting your specialty, years of experience, and key competencies. List each position with facility name, unit type, bed count, and patient population. New graduates should use a combination format highlighting clinical rotations and skills.',
  },
  {
    question: 'How long should a nursing resume be?',
    answer:
      'New graduates and nurses with less than 5 years experience should keep it to one page. Experienced nurses (5-15 years) can use two pages. Nurse practitioners, clinical nurse specialists, and nurse educators may use two pages to cover advanced practice experience, publications, and leadership roles.',
  },
];

export default function NurseResumePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'NXTED AI Resume Builder for Nurses',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'AI-powered resume builder designed for registered nurses, nurse practitioners, and healthcare professionals. Optimizes nursing resumes for hospital ATS systems.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free AI resume builder with ATS optimization for nurses',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '982',
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
              { name: 'Home', url: 'https://nxted.ai' },
              { name: 'Resume Builder', url: 'https://nxted.ai/resume' },
              { name: 'Nurse', url: 'https://nxted.ai/resume/nurse' },
            ])
          ),
        }}
      />
      <NurseClient />
    </>
  );
}
