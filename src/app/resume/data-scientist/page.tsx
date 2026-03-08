import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import DataScientistClient from './DataScientistClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'AI Resume Builder for Data Scientists | ML & Analytics Resumes | jobTED AI',
  description:
    'Build an ATS-optimized data scientist resume with AI. Showcase your machine learning models, statistical analysis, and data pipeline experience. Tailored for analytics, ML, and AI roles. Free to start.',
  keywords:
    'AI resume builder for data scientists, data scientist resume, machine learning resume builder, data analytics resume, ATS resume for data science, ML engineer resume template, data science resume tips, Python data resume, AI resume for analysts, data scientist resume builder 2026',
  canonical: '/resume/data-scientist',
});

const faqData = [
  {
    question: 'What should a data scientist resume include?',
    answer:
      'A data scientist resume should feature a strong technical skills section covering Python, R, SQL, ML frameworks (TensorFlow, PyTorch, Scikit-learn), and visualization tools (Tableau, Power BI). Include work experience highlighting model development, A/B testing, ETL pipelines, and business impact. Add education (MS/PhD in quantitative fields is valuable), publications, and Kaggle competitions or open-source contributions.',
  },
  {
    question: 'How do I pass ATS as a data scientist?',
    answer:
      'Data science ATS systems look for specific technical terms. Include exact tool names (e.g., "Scikit-learn" not just "machine learning"), statistical methods (regression, classification, clustering), and business metrics. Use standard headings and avoid abbreviations that ATS may not recognize. jobTED AI auto-maps your skills to ATS-friendly terminology.',
  },
  {
    question: 'Should I include Kaggle and personal projects on my data science resume?',
    answer:
      'Absolutely. Kaggle competitions (especially top 10% finishes), published notebooks, and personal ML projects demonstrate hands-on skills. Include the problem, approach, results, and tech stack for each project. Personal projects are especially important for career changers entering data science.',
  },
  {
    question: 'How do I quantify data science achievements on a resume?',
    answer:
      'Focus on business impact: "Developed churn prediction model reducing customer attrition by 23%, saving $2.4M annually," "Built recommendation engine increasing click-through rate by 35%," or "Automated ETL pipeline processing 50TB daily, reducing data latency from 6 hours to 20 minutes." Always tie your models to business outcomes.',
  },
  {
    question: 'What resume format works best for data scientists?',
    answer:
      'Use a reverse-chronological format with a prominent "Technical Skills" section organized by category (Languages, ML Frameworks, Cloud/Big Data, Visualization). Include a "Projects" section for significant ML work. Academic data scientists should include a "Publications" section. Keep it to 1-2 pages depending on experience level.',
  },
  {
    question: 'Should I use AI to write my data scientist resume?',
    answer:
      'Yes. AI resume builders understand data science terminology and can help you articulate model performance, business impact, and technical depth. jobTED AI suggests quantified bullet points, maps your skills to job requirements, and optimizes for ATS systems used by tech companies and consulting firms hiring data scientists.',
  },
];

export default function DataScientistResumePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'jobTED AI Resume Builder for Data Scientists',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'AI-powered resume builder designed for data scientists, ML engineers, and analytics professionals. Optimizes resumes for ATS systems and highlights statistical and ML expertise.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free AI resume builder with ATS optimization for data scientists',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '1234',
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
              { name: 'Data Scientist', url: 'https://jobted.ai/resume/data-scientist' },
            ])
          ),
        }}
      />
      <DataScientistClient />
    </>
  );
}
