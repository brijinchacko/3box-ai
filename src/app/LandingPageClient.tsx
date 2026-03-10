'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Brain, Target, BookOpen, FileText,
  ArrowRight, Zap, TrendingUp,
  CheckCircle2, BarChart3, Bot, Cpu, Award,
  DollarSign, Send, User, MapPin,
  Moon, Users, Workflow, Star, ChevronDown, ChevronUp, Quote,
  Clock, Heart, Shield, Rocket, Lock, Eye, ShieldCheck, Upload, Search,
  ClipboardPaste, Loader2, X
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useVisitorName } from '@/hooks/useVisitorName';
import Footer from '@/components/layout/Footer';
import CortexAvatar, { type CortexExpression } from '@/components/brand/CortexAvatar';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENT_LIST, COORDINATOR } from '@/lib/agents/registry';
import ResumePreviewSection from '@/components/landing/ResumePreviewSection';

import LiveApplicationCounter from '@/components/landing/LiveApplicationCounter';
import PlacementCellBanner from '@/components/landing/PlacementCellBanner';
import { saveOnboardingProfile } from '@/lib/onboarding/onboardingData';
import { useRegion } from '@/lib/geo';

// ─── Data Constants ──────────────────────────

const suggestedRoles = [
  // Tech
  'Software Engineer', 'Full Stack Developer', 'Data Scientist', 'UX Designer',
  // Business & Management
  'Product Manager', 'Business Analyst', 'Marketing Manager', 'Project Manager',
  // Creative & Media
  'Graphic Designer', 'Content Writer', 'Video Editor', 'Social Media Manager',
  // Healthcare & Science
  'Registered Nurse', 'Pharmacist', 'Lab Technician', 'Clinical Researcher',
  // Finance & Legal
  'Financial Analyst', 'Accountant', 'HR Manager', 'Legal Advisor',
  // Education & Others
  'Teacher', 'Civil Engineer', 'Architect', 'Supply Chain Manager',
];

// Country-to-region mapping for salary display
const countryRegionMap: Record<string, 'us' | 'eu' | 'uk' | 'in' | 'au' | 'global'> = {
  'united states': 'us', 'usa': 'us', 'us': 'us', 'america': 'us', 'canada': 'us',
  'united kingdom': 'uk', 'uk': 'uk', 'england': 'uk', 'scotland': 'uk', 'wales': 'uk',
  'germany': 'eu', 'france': 'eu', 'netherlands': 'eu', 'spain': 'eu', 'italy': 'eu', 'sweden': 'eu', 'norway': 'eu', 'denmark': 'eu', 'belgium': 'eu', 'austria': 'eu', 'switzerland': 'eu', 'ireland': 'eu', 'portugal': 'eu', 'finland': 'eu', 'poland': 'eu',
  'india': 'in', 'bangladesh': 'in', 'pakistan': 'in', 'sri lanka': 'in', 'nepal': 'in',
  'australia': 'au', 'new zealand': 'au',
};

interface SalaryData { us: string; eu: string; uk: string; in: string; au: string; global: string; maxNum: number }

const roleSalaryMap: Record<string, SalaryData> = {
  // Tech
  'Software Engineer':    { us: '$180K', eu: '€120K', uk: '£110K', in: '₹35L',  au: 'A$160K', global: '$100K', maxNum: 180000 },
  'Full Stack Developer': { us: '$170K', eu: '€110K', uk: '£100K', in: '₹30L',  au: 'A$150K', global: '$90K',  maxNum: 170000 },
  'Data Scientist':       { us: '$200K', eu: '€130K', uk: '£120K', in: '₹40L',  au: 'A$170K', global: '$110K', maxNum: 200000 },
  'UX Designer':          { us: '$150K', eu: '€95K',  uk: '£85K',  in: '₹22L',  au: 'A$130K', global: '$75K',  maxNum: 150000 },
  // Business & Management
  'Product Manager':      { us: '$190K', eu: '€130K', uk: '£115K', in: '₹35L',  au: 'A$160K', global: '$100K', maxNum: 190000 },
  'Business Analyst':     { us: '$130K', eu: '€90K',  uk: '£75K',  in: '₹18L',  au: 'A$120K', global: '$70K',  maxNum: 130000 },
  'Marketing Manager':    { us: '$145K', eu: '€95K',  uk: '£80K',  in: '₹20L',  au: 'A$130K', global: '$70K',  maxNum: 145000 },
  'Project Manager':      { us: '$155K', eu: '€100K', uk: '£85K',  in: '₹22L',  au: 'A$140K', global: '$80K',  maxNum: 155000 },
  // Creative & Media
  'Graphic Designer':     { us: '$95K',  eu: '€65K',  uk: '£55K',  in: '₹12L',  au: 'A$90K',  global: '$50K',  maxNum: 95000 },
  'Content Writer':       { us: '$85K',  eu: '€55K',  uk: '£50K',  in: '₹10L',  au: 'A$80K',  global: '$40K',  maxNum: 85000 },
  'Video Editor':         { us: '$90K',  eu: '€60K',  uk: '£50K',  in: '₹10L',  au: 'A$85K',  global: '$45K',  maxNum: 90000 },
  'Social Media Manager': { us: '$100K', eu: '€70K',  uk: '£60K',  in: '₹12L',  au: 'A$95K',  global: '$50K',  maxNum: 100000 },
  // Healthcare & Science
  'Registered Nurse':     { us: '$120K', eu: '€60K',  uk: '£45K',  in: '₹8L',   au: 'A$100K', global: '$50K',  maxNum: 120000 },
  'Pharmacist':           { us: '$140K', eu: '€80K',  uk: '£55K',  in: '₹10L',  au: 'A$120K', global: '$60K',  maxNum: 140000 },
  'Lab Technician':       { us: '$75K',  eu: '€50K',  uk: '£35K',  in: '₹6L',   au: 'A$70K',  global: '$35K',  maxNum: 75000 },
  'Clinical Researcher':  { us: '$130K', eu: '€85K',  uk: '£70K',  in: '₹15L',  au: 'A$110K', global: '$60K',  maxNum: 130000 },
  // Finance & Legal
  'Financial Analyst':    { us: '$150K', eu: '€95K',  uk: '£85K',  in: '₹18L',  au: 'A$130K', global: '$70K',  maxNum: 150000 },
  'Accountant':           { us: '$100K', eu: '€65K',  uk: '£55K',  in: '₹10L',  au: 'A$95K',  global: '$45K',  maxNum: 100000 },
  'HR Manager':           { us: '$130K', eu: '€85K',  uk: '£70K',  in: '₹18L',  au: 'A$120K', global: '$60K',  maxNum: 130000 },
  'Legal Advisor':        { us: '$180K', eu: '€110K', uk: '£100K', in: '₹25L',  au: 'A$160K', global: '$80K',  maxNum: 180000 },
  // Education & Others
  'Teacher':              { us: '$75K',  eu: '€50K',  uk: '£42K',  in: '₹8L',   au: 'A$85K',  global: '$35K',  maxNum: 75000 },
  'Civil Engineer':       { us: '$130K', eu: '€80K',  uk: '£65K',  in: '₹12L',  au: 'A$120K', global: '$55K',  maxNum: 130000 },
  'Architect':            { us: '$120K', eu: '€75K',  uk: '£60K',  in: '₹15L',  au: 'A$110K', global: '$55K',  maxNum: 120000 },
  'Supply Chain Manager': { us: '$130K', eu: '€85K',  uk: '£70K',  in: '₹20L',  au: 'A$120K', global: '$60K',  maxNum: 130000 },
};

const roleSkillMap: Record<string, string[]> = {
  // Tech
  'Software Engineer': ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS', 'System Design'],
  'Full Stack Developer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Git', 'Docker'],
  'Data Scientist': ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'Tableau', 'Statistics', 'Machine Learning'],
  'UX Designer': ['Figma', 'User Research', 'Prototyping', 'Wireframing', 'Design Systems', 'Usability Testing', 'Adobe XD', 'CSS', 'Accessibility', 'Visual Design'],
  // Business & Management
  'Product Manager': ['Product Strategy', 'User Research', 'Agile/Scrum', 'Data Analysis', 'Roadmapping', 'A/B Testing', 'SQL', 'Figma', 'JIRA', 'Stakeholder Management'],
  'Business Analyst': ['SQL', 'Excel', 'Power BI', 'Tableau', 'JIRA', 'Process Mapping', 'Requirements Gathering', 'Agile', 'Data Analysis', 'Stakeholder Management'],
  'Marketing Manager': ['SEO/SEM', 'Google Analytics', 'Social Media', 'Content Strategy', 'Email Marketing', 'Copywriting', 'CRM Tools', 'Branding', 'Market Research', 'Campaign Management'],
  'Project Manager': ['Agile/Scrum', 'JIRA', 'Risk Management', 'Budgeting', 'Stakeholder Communication', 'MS Project', 'Gantt Charts', 'Team Leadership', 'Resource Planning', 'Documentation'],
  // Creative & Media
  'Graphic Designer': ['Adobe Photoshop', 'Illustrator', 'Figma', 'Typography', 'Branding', 'Layout Design', 'Color Theory', 'InDesign', 'Motion Graphics', 'Print Design'],
  'Content Writer': ['SEO Writing', 'Copywriting', 'Blogging', 'Research', 'Editing', 'CMS Tools', 'Social Media', 'Storytelling', 'Grammar', 'Content Strategy'],
  'Video Editor': ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Color Grading', 'Motion Graphics', 'Sound Design', 'Storytelling', 'YouTube', 'Thumbnails', 'Scriptwriting'],
  'Social Media Manager': ['Content Creation', 'Analytics', 'Community Management', 'Paid Ads', 'Canva', 'Scheduling Tools', 'Influencer Marketing', 'Copywriting', 'Trend Analysis', 'Engagement'],
  // Healthcare & Science
  'Registered Nurse': ['Patient Care', 'Clinical Assessment', 'IV Therapy', 'EMR Systems', 'Medication Admin', 'CPR/BLS', 'Wound Care', 'Communication', 'Critical Thinking', 'Team Collaboration'],
  'Pharmacist': ['Drug Knowledge', 'Patient Counseling', 'Prescription Review', 'Pharmacy Software', 'Compounding', 'Regulatory Compliance', 'Inventory Management', 'Clinical Research', 'Communication', 'Chemistry'],
  'Lab Technician': ['Lab Equipment', 'Sample Analysis', 'Quality Control', 'Safety Protocols', 'Data Recording', 'Microscopy', 'LIMS Software', 'Calibration', 'Documentation', 'Attention to Detail'],
  'Clinical Researcher': ['Research Design', 'Data Analysis', 'SPSS/SAS', 'Literature Review', 'Ethics Compliance', 'Grant Writing', 'Clinical Trials', 'Medical Terminology', 'Report Writing', 'Statistics'],
  // Finance & Legal
  'Financial Analyst': ['Financial Modeling', 'Excel', 'SQL', 'Bloomberg', 'Valuation', 'Budgeting', 'Forecasting', 'Power BI', 'Accounting', 'Risk Analysis'],
  'Accountant': ['GAAP/IFRS', 'Tax Preparation', 'QuickBooks', 'Excel', 'Auditing', 'Financial Reporting', 'Payroll', 'Reconciliation', 'ERP Systems', 'Compliance'],
  'HR Manager': ['Recruitment', 'Employee Relations', 'HRIS', 'Performance Management', 'Labor Law', 'Onboarding', 'Compensation', 'Training & Development', 'Conflict Resolution', 'Policy Development'],
  'Legal Advisor': ['Legal Research', 'Contract Drafting', 'Compliance', 'Negotiation', 'Litigation', 'Due Diligence', 'Regulatory Affairs', 'IP Law', 'Legal Writing', 'Case Management'],
  // Education & Others
  'Teacher': ['Curriculum Design', 'Classroom Management', 'Assessment', 'Differentiation', 'EdTech Tools', 'Communication', 'Lesson Planning', 'Student Engagement', 'Parent Relations', 'Special Education'],
  'Civil Engineer': ['AutoCAD', 'Structural Analysis', 'Project Management', 'Surveying', 'Concrete Design', 'Geotechnical', 'Building Codes', 'Revit', 'Cost Estimation', 'Environmental Assessment'],
  'Architect': ['AutoCAD', 'Revit', 'SketchUp', '3D Modeling', 'Building Codes', 'Sustainability', 'Project Management', 'Client Relations', 'Construction Docs', 'Interior Design'],
  'Supply Chain Manager': ['Logistics', 'Inventory Management', 'ERP Systems', 'Procurement', 'Demand Planning', 'Vendor Management', 'Data Analysis', 'Cost Optimization', 'Quality Control', 'Lean Six Sigma'],
};

const genericSkills = [
  'Communication', 'Problem Solving', 'Leadership', 'Data Analysis', 'Excel',
  'Project Management', 'Teamwork', 'Critical Thinking', 'Time Management', 'Creativity',
  'Public Speaking', 'Negotiation', 'Research', 'Writing', 'Customer Service',
  'Adaptability', 'Attention to Detail', 'Strategic Planning', 'Decision Making', 'Networking',
];

const experienceLevels = [
  { value: 'fresher', label: 'Fresher / Student', desc: 'No work experience yet' },
  { value: '0-1', label: '0-1 Years', desc: 'Just getting started' },
  { value: '1-3', label: '1-3 Years', desc: 'Early career' },
  { value: '3-5', label: '3-5 Years', desc: 'Mid-level professional' },
  { value: '5-10', label: '5-10 Years', desc: 'Senior level' },
  { value: '10+', label: '10+ Years', desc: 'Industry veteran' },
];

const currentStatuses = [
  { value: 'student', label: 'Student', emoji: '🎓' },
  { value: 'employed', label: 'Employed', emoji: '💼' },
  { value: 'job-searching', label: 'Job Searching', emoji: '🔍' },
  { value: 'career-change', label: 'Career Change', emoji: '🔄' },
  { value: 'freelancer', label: 'Freelancer', emoji: '💻' },
];

const educationLevels = [
  'High School', "Associate's", "Bachelor's", "Master's", 'PhD', 'Self-Taught', 'Bootcamp',
];

// Demo AI responses — short, encouraging, and clear
const regionSalaryKey: Record<string, keyof SalaryData> = {
  'IN': 'in', 'US': 'us', 'GB': 'uk', 'AU': 'au',
  'DE': 'eu', 'FR': 'eu', 'NL': 'eu', 'ES': 'eu', 'IT': 'eu',
  'CA': 'us', 'IE': 'eu', 'SE': 'eu', 'NO': 'eu',
};

const regionSalaryLabel: Record<string, string> = {
  'in': 'India', 'us': 'the US', 'uk': 'the UK', 'eu': 'Europe', 'au': 'Australia', 'global': 'your region',
};

const demoResponses: Record<string, (ctx: any) => string> = {
  role: (ctx) => {
    const salary = roleSalaryMap[ctx.targetRole];
    if (!salary) return `${ctx.targetRole} — exciting choice! Let's map your path.`;
    const rKey = regionSalaryKey[ctx.countryCode] || 'global';
    const label = regionSalaryLabel[rKey] || 'your region';
    return `Great pick! Top ${ctx.targetRole}s earn up to ${salary[rKey]} in ${label}.`;
  },
  experience: (ctx) => {
    if (ctx.experience === 'fresher') return `Perfect starting point — I'll build a plan to get you hired fast.`;
    if (['0-1', '1-3'].includes(ctx.experience)) return `Good foundation! Let's accelerate your growth.`;
    return `Strong experience! Time to aim for top-tier roles.`;
  },
  status: (ctx) => {
    const msgs: Record<string, string> = {
      'student': `Great time to start! I'll prepare you before graduation.`,
      'employed': `Smart move planning your next step while employed.`,
      'job-searching': `Let's make you stand out and land offers faster.`,
      'career-change': `I'll help transfer your skills to ${ctx.targetRole}.`,
      'freelancer': `Freelance experience is valuable. Let's grow from here.`,
    };
    return msgs[ctx.status] || `Got it — let's keep building your profile.`;
  },
  education: (ctx) => `${ctx.education} background noted. ${ctx.education === 'Self-Taught' || ctx.education === 'Bootcamp' ? 'Employers value skills over degrees.' : 'Solid foundation!'} Almost done.`,
  skills: (ctx) => `${ctx.skills?.length || 0} skills locked in${ctx.skills?.length >= 5 ? ' — strong profile!' : '. Consider adding more for a stronger match.'}`,
};

// ─── Orbiting Agent (manages sleep state + orbit radius) ──────────────────

function OrbitingAgent({ agent, index }: { agent: typeof AGENT_LIST[0]; index: number }) {
  const [isSleeping, setIsSleeping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverRef = useRef(false);
  const angle = (index * 60 - 90) * (Math.PI / 180);
  const awakeR = 160; // closer when awake
  const sleepR = 220; // farther when sleeping

  useEffect(() => {
    let cancelled = false;
    const cycle = () => {
      if (cancelled) return;
      const awakeTime = 8000 + Math.random() * 12000;
      setTimeout(() => {
        if (cancelled || hoverRef.current) { if (!cancelled) cycle(); return; }
        setIsSleeping(true);
        const sleepTime = 4000 + Math.random() * 6000;
        setTimeout(() => {
          if (cancelled) return;
          setIsSleeping(false);
          cycle();
        }, sleepTime);
      }, awakeTime);
    };
    setTimeout(() => { if (!cancelled) cycle(); }, Math.random() * 10000);
    return () => { cancelled = true; };
  }, []);

  const handleMouseEnter = () => {
    hoverRef.current = true;
    setIsHovered(true);
    setIsSleeping(false); // wake on hover
  };
  const handleMouseLeave = () => {
    hoverRef.current = false;
    setIsHovered(false);
  };

  // Agent is visually awake if hovered OR not sleeping
  const showSleeping = isSleeping && !isHovered;
  const r = showSleeping ? sleepR : awakeR;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      whileInView={{ opacity: 1, scale: 1, x: r * Math.cos(angle), y: r * Math.sin(angle) }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5, type: 'spring' }}
      className="absolute z-10 group/agent"
      animate={{ x: r * Math.cos(angle), y: r * Math.sin(angle), opacity: showSleeping ? 0.5 : 1 }}
      whileHover={{ opacity: 1, scale: 1.1 }}
      style={{ left: '50%', top: '50%', marginLeft: -22, marginTop: -22 }}
      onHoverStart={handleMouseEnter}
      onHoverEnd={handleMouseLeave}
    >
      <Link href={`/agents/${agent.id}`} className="relative block">
        <AgentAvatar agentId={agent.id} size={44} pulse sleeping={showSleeping} />
        {/* Tooltip on hover */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 opacity-0 group-hover/agent:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
          <div className="bg-surface-100/95 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-center min-w-[160px] max-w-[200px]">
            <div className="text-xs font-semibold text-white">{agent.displayName}</div>
            <div className={`text-[10px] font-medium ${agent.color}`}>{agent.role}</div>
            <div className="text-[9px] text-white/35 mt-1 italic leading-tight">{agent.storyLine}</div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Landing Page Constants ──────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};


const howItWorks = [
  { step: '01', title: 'Upload & Set Goals', desc: 'Drop your resume and tell us your target role, salary range, and preferred locations. Cortex instantly maps your skills, experience, and career ambitions into a personalized hunt strategy.', icon: Upload, color: 'from-neon-blue to-cyan-400' },
  { step: '02', title: 'Scout Hunts Jobs', desc: 'Scout searches LinkedIn, Indeed, Naukri, Google Jobs, and 6+ platforms overnight. Every listing is analyzed for fit — not just keywords, but culture, growth potential, and salary match.', icon: Search, color: 'from-neon-purple to-violet-400' },
  { step: '03', title: 'Forge + Archer Execute', desc: 'Forge tailors your resume for each specific job — different keywords, different emphasis, different story. Archer sends each application with a custom cover letter. Sentinel reviews everything before it goes out.', icon: Moon, color: 'from-amber-400 to-orange-400' },
  { step: '04', title: 'Wake Up to Results', desc: 'Your dashboard shows matched jobs, sent applications, and Atlas-prepared interview questions — all completed overnight. Real progress, delivered while you slept.', icon: Zap, color: 'from-neon-green to-emerald-400' },
];

// ─── FAQ Data ───────────────────────────────
const faqItems = [
  { q: 'Do I really get 20 free applications?', a: 'Yes. Upload your resume, pick your target role, and our AI finds 20 matching jobs and applies to each one with a tailored cover letter. No credit card. No catch. After your free burst, plans start at \u20B9249/mo for unlimited applications.' },
  { q: 'Will AI send wrong or spammy applications?', a: 'No. Each application is individually crafted by Agent Forge \u2014 unique cover letter, tailored resume, quality-checked by Sentinel before sending. Companies see a thoughtful application, not a template.' },
  { q: 'How does the AI actually apply?', a: 'Archer generates a unique cover letter for each job, then either submits through job portals directly or sends a professional cold email to the company\u2019s HR. Every application is tracked in your dashboard.' },
  { q: 'Is my data safe?', a: 'Absolutely. All data is encrypted in transit and at rest. We never sell or share your information. You can delete your account and all data anytime. GDPR compliant.' },
  { q: 'Do I need to install anything?', a: 'No. 3BOX AI is entirely browser-based. Sign up and your agents start working immediately \u2014 no downloads, no extensions, no setup.' },
  { q: 'What happens after the free 20 applications?', a: 'You can track all your applications and responses for free. To get unlimited auto-applications every night, interview prep, and full agent access, plans start at \u20B9249/mo.' },
];

// ─── Reviews Data ──────────────────────────
interface Review { name: string; role: string; text: string; rating: number; avatar: string; transformation?: string; country?: string }

// Massive review pool for the scrolling wall
const allReviews: Review[] = [
  // ── Row 1 batch ──
  { name: 'Sarah Chen', role: 'UX Designer', text: 'I went to sleep nervous about my job search. Woke up to 5 tailored applications sent overnight. Two weeks later, I was at a FAANG company.', rating: 5, avatar: 'SC', transformation: 'Hired in 14 days', country: 'US' },
  { name: 'Priya Sharma', role: 'Software Engineer', text: 'I was sending applications into the void for months. 3BOX AI changed everything — the ATS checker alone tripled my interview rate.', rating: 5, avatar: 'PS', transformation: 'ATS: 38% → 94%', country: 'IN' },
  { name: 'Emma Thompson', role: 'Marketing Manager', text: 'The agents found roles across London and Manchester I would have completely missed. Three weeks later, I had an offer.', rating: 5, avatar: 'ET', transformation: 'Hired in 3 weeks', country: 'UK' },
  { name: 'Michael Torres', role: 'Software Engineer', text: 'My resume was invisible to ATS systems. 3BOX AI fixed that overnight — three interviews in the first week.', rating: 5, avatar: 'MT', transformation: 'ATS: 45% → 92%', country: 'US' },
  { name: 'Rahul Verma', role: 'Data Scientist', text: 'The AI built a resume that perfectly highlighted my IIT background. Within a week, Google and Amazon both reached out.', rating: 5, avatar: 'RV', transformation: 'Hired in 8 days', country: 'IN' },
  { name: 'Lena Kowalski', role: 'Frontend Developer', text: 'Applied to 200 jobs manually with zero results. 3BOX sent 30 targeted applications in one night. Got 4 interviews.', rating: 5, avatar: 'LK', transformation: '200 apps → 4 interviews', country: 'DE' },
  { name: 'James Wilson', role: 'Software Engineer', text: 'My career coach missed ATS issues that 3BOX caught instantly. Went from zero callbacks to multiple competing offers.', rating: 5, avatar: 'JW', transformation: '0 → 4 offers', country: 'UK' },
  { name: 'Aisha Mohammed', role: 'Data Analyst', text: 'As a fresh graduate, I had no idea where to start. Agent Sage identified my skill gaps and Cortex built a plan. Hired in 3 weeks.', rating: 5, avatar: 'AM', transformation: 'Graduate → Hired', country: 'AE' },
  { name: 'Carlos Rivera', role: 'DevOps Engineer', text: 'The salary negotiation data alone was worth it. I walked into my review with proof and walked out with a 25% raise.', rating: 5, avatar: 'CR', transformation: '+25% salary', country: 'US' },
  { name: 'Yuki Tanaka', role: 'UI Designer', text: 'Agent Forge tailored my portfolio description for each company. The personalization was incredible — 5 out of 8 callbacks.', rating: 5, avatar: 'YT', transformation: '5/8 callbacks', country: 'JP' },
  // ── Row 2 batch ──
  { name: 'Jessica Williams', role: 'Product Manager', text: 'The cover letter generator and interview prep saved me hours every single day. The quality blew me away for a free tool.', rating: 5, avatar: 'JW', transformation: '10+ hrs saved/week', country: 'US' },
  { name: 'Ananya Patel', role: 'Product Manager', text: 'Scout found roles I never knew existed. The salary estimator was spot-on for Indian markets — helped me negotiate 20% more.', rating: 5, avatar: 'AP', transformation: '+20% salary', country: 'IN' },
  { name: 'Sophie Clarke', role: 'Business Analyst', text: 'The salary estimator knew UK market rates perfectly. I walked into my negotiation armed with data — and walked out with 15% more.', rating: 5, avatar: 'SC', transformation: '+15% salary', country: 'UK' },
  { name: 'David Kim', role: 'Data Scientist', text: 'Forge optimized my resume differently for each application — automatically. That level of personalization got me noticed.', rating: 4, avatar: 'DK', transformation: '3x more callbacks', country: 'US' },
  { name: 'Fatima Al-Hassan', role: 'Project Manager', text: 'Career change at 35 felt impossible. The agents mapped my transferable skills and found PM roles I qualified for. Hired in a month.', rating: 5, avatar: 'FA', transformation: 'Career switch success', country: 'CA' },
  { name: 'Tomasz Nowak', role: 'Backend Developer', text: 'Three months of silence before 3BOX. Two weeks after, I had offers from Berlin and Amsterdam. The agents do not sleep.', rating: 5, avatar: 'TN', transformation: '2 offers in 2 weeks', country: 'PL' },
  { name: 'Maria Garcia', role: 'Data Scientist', text: 'My ATS score went from 50% to 95%. The difference was immediate — callbacks started flooding in within days.', rating: 5, avatar: 'MG', transformation: 'ATS: 50% → 95%' },
  { name: 'Ravi Krishnan', role: 'ML Engineer', text: 'Agent Atlas prepared me for 6 different interview formats. I aced every round. The prep was better than any coaching service.', rating: 5, avatar: 'RK', transformation: 'Aced all rounds', country: 'IN' },
  { name: 'Elena Popova', role: 'QA Engineer', text: 'I was skeptical about AI writing my cover letters. Then I read what Forge produced. It knew my story better than I did.', rating: 5, avatar: 'EP', transformation: 'Cover letters that convert', country: 'RU' },
  { name: 'Nathan Brooks', role: 'Cloud Architect', text: 'Senior roles are hard to find. Scout discovered opportunities on platforms I had never even heard of. Game changer.', rating: 5, avatar: 'NB', transformation: 'Found hidden roles', country: 'AU' },
  // ── Row 3 batch ──
  { name: 'Vikram Singh', role: 'Full Stack Developer', text: 'From resume to interview prep — the agents handled my entire journey. I went from unemployed to placed at a Series B startup.', rating: 4, avatar: 'VS', transformation: '0 → Offer in 3 weeks', country: 'IN' },
  { name: 'Oliver Brown', role: 'Product Manager', text: 'Scout is like having a recruiter who never sleeps. It found my current role at a fintech startup I had never heard of.', rating: 4, avatar: 'OB', transformation: 'Found dream role', country: 'UK' },
  { name: 'Chris Lee', role: 'Product Manager', text: 'Six AI agents working while I sleep? It sounded like science fiction. Two weeks and one job offer later, I am a believer.', rating: 5, avatar: 'CL', transformation: 'Hired in 2 weeks' },
  { name: 'Nina Patel', role: 'UX Designer', text: 'The cover letter generator and interview prep saved me hours every day. This is what the future of job searching looks like.', rating: 4, avatar: 'NP', transformation: '10+ hrs saved/week' },
  { name: 'Daniel Okafor', role: 'Cybersecurity Analyst', text: 'Applied to niche security roles that need specific certs. Forge highlighted my CISSP perfectly for each application. 3 offers.', rating: 5, avatar: 'DO', transformation: '3 offers in niche field', country: 'NG' },
  { name: 'Mei Lin', role: 'Product Designer', text: 'Switching countries and careers at the same time. 3BOX handled visa-friendly roles and tailored everything. Incredible.', rating: 5, avatar: 'ML', transformation: 'International hire', country: 'SG' },
  { name: 'Alex Johnson', role: 'Software Engineer', text: 'I used to spend 4 hours a day job searching. Now my agent team does it all — finding, applying, prepping — while I sleep.', rating: 5, avatar: 'AJ', transformation: '4 hrs/day → 0' },
  { name: 'Isabella Romano', role: 'Marketing Analyst', text: 'Sentinel caught a typo in my resume that would have been embarrassing. The quality review step is pure gold.', rating: 5, avatar: 'IR', transformation: 'Zero errors shipped', country: 'IT' },
  { name: 'Hassan Ali', role: 'iOS Developer', text: 'My portfolio was strong but my resume was weak. Forge rewrote it, Archer sent it out, and I had 5 calls in 4 days.', rating: 5, avatar: 'HA', transformation: '5 calls in 4 days', country: 'PK' },
  { name: 'Sophie Dubois', role: 'HR Manager', text: 'I work in HR and know what recruiters look for. 3BOX nailed it — the AI understands hiring better than most humans.', rating: 5, avatar: 'SD', transformation: 'HR expert approved', country: 'FR' },
  // ── Row 4 batch (extra) ──
  { name: 'Raj Mehta', role: 'Data Engineer', text: 'Sage told me to learn Spark before applying. I did. Two weeks later, I had an offer I would not have been qualified for otherwise.', rating: 5, avatar: 'RM', transformation: 'Skill gap → Hired', country: 'IN' },
  { name: 'Anna Svensson', role: 'Scrum Master', text: 'The agents sent 15 targeted applications overnight. I woke up to 3 interview requests. This is not normal. This is magic.', rating: 5, avatar: 'AS', transformation: '15 apps → 3 interviews', country: 'SE' },
  { name: 'Kevin O\'Brien', role: 'Solutions Architect', text: 'After being laid off, I was devastated. The agents gave me hope and results. New role in 10 days. Better pay. Better company.', rating: 5, avatar: 'KO', transformation: 'Laid off → Hired in 10d', country: 'IE' },
  { name: 'Zara Khan', role: 'Graphic Designer', text: 'Creative roles are tough to land. Scout found agencies actively hiring, Forge tailored my portfolio pitch. Landed my dream agency.', rating: 5, avatar: 'ZK', transformation: 'Dream agency landed', country: 'UK' },
  { name: 'Lucas Fernandez', role: 'Full Stack Developer', text: 'I am not great at selling myself. The agents are. My new resume got more responses in a week than I got in 6 months on my own.', rating: 5, avatar: 'LF', transformation: '6 months → 1 week', country: 'BR' },
  { name: 'Grace Kim', role: 'Business Analyst', text: 'The interview prep was insanely thorough. Atlas knew the exact questions my target companies ask. I walked in prepared.', rating: 5, avatar: 'GK', transformation: 'Interview ace', country: 'KR' },
  { name: 'Marco Bianchi', role: 'DevOps Engineer', text: 'Sentinel reviewed my applications before they went out. Caught formatting issues, keyword gaps, even tone problems. Flawless.', rating: 5, avatar: 'MB', transformation: 'Flawless applications', country: 'IT' },
  { name: 'Chloe Martin', role: 'Content Strategist', text: 'I thought AI could not write creative cover letters. Forge proved me wrong every single time. Each one felt personal and authentic.', rating: 5, avatar: 'CM', transformation: 'Personal cover letters', country: 'AU' },
  // ── India Focus ──
  { name: 'Sneha Reddy', role: 'Software Developer', text: 'Applied to 15 companies through Naukri in one night. Got placed in 2 weeks with a 45% hike.', rating: 5, avatar: 'SR', transformation: '45% salary hike', country: 'IN' },
  { name: 'Arjun Nair', role: 'Data Analyst', text: 'Fresher from VIT. No connections. 3BOX found me a Bangalore startup paying 8 LPA. Unreal.', rating: 5, avatar: 'AN', transformation: 'Fresher \u2192 8 LPA', country: 'IN' },
  { name: 'Rohit Bansal', role: 'Full Stack Developer', text: 'Applied to TCS, Infosys, Wipro, and 12 startups in one night. Got calls from 4 companies.', rating: 5, avatar: 'RB', transformation: '4 calls in 1 week', country: 'IN' },
  { name: 'Kavitha Suresh', role: 'Product Manager', text: 'Shared 3BOX with my batch. 15 out of 20 got placed. Our placement cell is shook.', rating: 5, avatar: 'KS', transformation: '15/20 batch placed', country: 'IN' },
];

// Keep region-based for initial featured display
const reviewsByRegion: Record<string, Review[]> = {
  IN: allReviews.filter(r => r.country === 'IN').slice(0, 4),
  US: allReviews.filter(r => r.country === 'US').slice(0, 4),
  GB: allReviews.filter(r => r.country === 'UK').slice(0, 4),
  DEFAULT: allReviews.slice(0, 4),
};

// ─── Conversational Steps ────────────────────

type ConvoStep = 'intro' | 'resume' | 'role' | 'experience' | 'status' | 'education' | 'skills' | 'personal' | 'complete';

const stepOrder: ConvoStep[] = ['intro', 'resume', 'role', 'experience', 'status', 'education', 'skills', 'personal', 'complete'];

interface Message {
  from: 'nova' | 'user';
  text: string;
  type?: 'question' | 'response' | 'insight';
}

// ─── Main Component ──────────────────────────

export default function LandingPageClient() {
  const router = useRouter();
  const { firstName } = useVisitorName();
  const { countryCode, isLoading: geoLoading } = useRegion();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<ConvoStep>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');

  // Resume upload state
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste' | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collected data
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');
  const [status, setStatus] = useState('');
  const [education, setEducation] = useState('');

  // Check if user already completed
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Cortex expression state (reactive eye animations)
  const [cortexExpression, setCortexExpression] = useState<CortexExpression>('normal');
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const triggerExpression = (expr: CortexExpression, duration = 2500) => {
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    setCortexExpression(expr);
    expressionTimerRef.current = setTimeout(() => setCortexExpression('normal'), duration);
  };

  useEffect(() => {
    return () => { if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current); };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('3box_onboarding_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile.targetRole) {
          setAlreadyDone(true);
          setTargetRole(profile.targetRole);
          setFullName(profile.fullName || '');
        }
      } catch {}
    }
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show intro message on mount
  useEffect(() => {
    if (!alreadyDone) {
      setTimeout(() => {
        setMessages([{
          from: 'nova',
          text: "Hey! I'm Agent Cortex. Upload your resume to fast-track onboarding, or skip to fill manually.",
          type: 'question',
        }]);
        setTimeout(() => setStep('resume'), 600);
      }, 500);
    }
  }, [alreadyDone]);

  // Get AI response (with demo fallback)
  const getAIResponse = async (stepName: string, userInput: string, ctx: any): Promise<string> => {
    try {
      const res = await fetch('/api/ai/onboarding-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepName, userInput, context: ctx }),
      });
      const data = await res.json();
      if (data.message && data.message.length > 10) return data.message;
    } catch {}
    // Demo fallback
    const fn = demoResponses[stepName];
    return fn ? fn(ctx) : "Let's keep going! 👍";
  };

  const addCortexMessage = (text: string, type: Message['type'] = 'response') => {
    setIsTyping(true);
    // Clean markdown symbols and keep response concise
    let clean = text.replace(/\*+/g, '').replace(/\d+\.\s+/g, '').replace(/[-•]\s+/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length > 150) {
      const cut = clean.lastIndexOf(' ', 150);
      clean = clean.slice(0, cut > 100 ? cut : 150) + '...';
    }
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { from: 'nova', text: clean, type }]);
    }, 800 + Math.random() * 400);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { from: 'user', text }]);
  };

  const proceedToStep = (nextStep: ConvoStep) => {
    setTimeout(() => setStep(nextStep), 400);
  };

  // ─── Resume Handlers ──────────────────────

  const handleFileSelect = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    const validExts = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setResumeError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File size must be under 10MB.');
      return;
    }
    setSelectedFile(file);
    setResumeError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const parseResume = async (mode: 'file' | 'text') => {
    setResumeParsing(true);
    setResumeError('');

    try {
      let res: Response;

      if (mode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await fetch('/api/resume/parse', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: resumeText }),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to parse resume');

      const parsed = result.data;

      // Auto-populate all fields
      if (parsed.fullName) setFullName(parsed.fullName);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.targetRole) { setTargetRole(parsed.targetRole); setRoleInput(parsed.targetRole); }
      if (parsed.experienceLevel) setExperience(parsed.experienceLevel);
      if (parsed.currentStatus) setStatus(parsed.currentStatus);
      if (parsed.educationLevel) setEducation(parsed.educationLevel);
      if (parsed.skills?.length) setSelectedSkills(parsed.skills.slice(0, 10));

      setResumeParsed(true);
      triggerExpression('heart');

      // Show success message and skip to personal info step (name/location confirmation)
      addCortexMessage(`Resume parsed! I found your details — ${parsed.fullName || 'your profile'}. Let's confirm your info.`);

      // Auto-advance to personal step to confirm name + location, then skip to complete
      setTimeout(() => setStep('personal'), 1500);
    } catch (err: any) {
      setResumeError(err.message || 'Failed to parse resume. Try again or skip.');
    } finally {
      setResumeParsing(false);
    }
  };

  // ─── Step Handlers ──────────────────────

  const handleRoleSubmit = async () => {
    if (!roleInput.trim()) return;
    const role = roleInput.trim();
    setTargetRole(role);
    addUserMessage(role);
    setRoleInput('');
    setShowSuggestions(false);
    triggerExpression('heart');

    const aiMsg = await getAIResponse('role', role, { targetRole: role, countryCode });
    addCortexMessage(aiMsg);
    proceedToStep('experience');
  };

  const handleExperienceSelect = async (lvl: typeof experienceLevels[0]) => {
    setExperience(lvl.value);
    addUserMessage(lvl.label);
    triggerExpression('star');

    const aiMsg = await getAIResponse('experience', lvl.value, { targetRole, experience: lvl.value });
    addCortexMessage(aiMsg);
    proceedToStep('status');
  };

  const handleStatusSelect = async (s: typeof currentStatuses[0]) => {
    setStatus(s.value);
    addUserMessage(`${s.emoji} ${s.label}`);
    triggerExpression('happy');

    const aiMsg = await getAIResponse('status', s.value, { targetRole, experience, status: s.value });
    addCortexMessage(aiMsg);
    proceedToStep('education');
  };

  const handleEducationSelect = async (edu: string) => {
    setEducation(edu);
    addUserMessage(edu);
    triggerExpression('thinking');

    const aiMsg = await getAIResponse('education', edu, { targetRole, experience, status, education: edu });
    addCortexMessage(aiMsg);
    proceedToStep('skills');
  };

  const handleSkillsDone = async () => {
    if (!selectedSkills.includes('None') && selectedSkills.length < 2) return;
    const displaySkills = selectedSkills.includes('None') ? ['None (will be assessed)'] : selectedSkills;
    addUserMessage(displaySkills.join(', '));
    triggerExpression('star');

    const skillsForAI = selectedSkills.includes('None') ? ['General Skills'] : selectedSkills;
    const aiMsg = await getAIResponse('skills', skillsForAI.join(', '), { targetRole, experience, status, education, skills: skillsForAI });
    addCortexMessage(aiMsg);
    proceedToStep('personal');
  };

  const handlePersonalDone = () => {
    if (!fullName.trim() || !location.trim()) return;
    addUserMessage(`${fullName} from ${location}`);
    triggerExpression('heart');

    // Save to unified onboarding data model
    const actualSkills = selectedSkills.includes('None') ? [] : selectedSkills;
    saveOnboardingProfile({
      fullName, location,
      targetRole, experienceLevel: experience, currentStatus: status,
      educationLevel: education, skills: actualSkills,
    });
    // Also save skill scores and resume draft (legacy keys still used by dashboard)
    localStorage.setItem('3box_skill_scores', JSON.stringify(
      actualSkills.reduce((acc, skill) => {
        acc[skill] = experience === 'fresher' ? 30 : experience === '0-1' ? 40 : experience === '1-3' ? 55 : experience === '3-5' ? 65 : experience === '5-10' ? 75 : 85;
        return acc;
      }, {} as Record<string, number>)
    ));
    const resumeData = {
      personalInfo: { fullName, email: '', phone: '', location, linkedin: '' },
      summary: `${experience === 'fresher' ? 'Aspiring' : 'Experienced'} ${targetRole}${actualSkills.length > 0 ? ` passionate about ${actualSkills.slice(0, 3).join(', ')}` : ' ready to learn and grow'}.`,
      experience: [],
      education: { level: education, field: '', institution: '', year: '' },
      skills: actualSkills,
      targetRole,
    };
    localStorage.setItem('3box_resume_draft', JSON.stringify(resumeData));

    // Compute salary message based on user's country
    const region = (() => {
      const loc = location.toLowerCase();
      for (const [key, r] of Object.entries(countryRegionMap)) { if (loc.includes(key)) return r; }
      return 'global' as const;
    })();
    const sal = roleSalaryMap[targetRole];
    const salaryMsg = sal ? ` Top ${targetRole}s earn up to ${sal[region]} in your area.` : '';
    addCortexMessage(`${fullName.split(' ')[0]}, your profile is ready!${salaryMsg} Sign up to unlock your career plan.`);
    proceedToStep('complete');
  };

  // Restart onboarding
  const handleRestart = () => {
    setAlreadyDone(false);
    setStep('intro');
    setMessages([]);
    setTargetRole('');
    setExperience('');
    setStatus('');
    setEducation('');
    setSelectedSkills([]);
    setFullName('');
    setLocation('');
    setResumeMode(null);
    setResumeText('');
    setResumeParsed(false);
    setResumeParsing(false);
    setResumeError('');
    setSelectedFile(null);
    localStorage.removeItem('3box_onboarding_profile');
    localStorage.removeItem('3box_target_role');
    setTimeout(() => {
      setMessages([{ from: 'nova', text: "Hey! I'm Agent Cortex, your career coach. Let's find the perfect path for you.", type: 'question' }]);
      setTimeout(() => setStep('role'), 600);
    }, 300);
  };

  const filteredRoles = roleInput.trim()
    ? suggestedRoles.filter((r) => r.toLowerCase().includes(roleInput.toLowerCase()))
    : suggestedRoles;

  const suggestedSkills = roleSkillMap[targetRole] || genericSkills;
  const salaryInfo = roleSalaryMap[targetRole];

  // Detect user's region from location for country-specific salary
  const getUserRegion = (): 'us' | 'eu' | 'uk' | 'in' | 'au' | 'global' => {
    if (!location) return 'global';
    const loc = location.toLowerCase();
    for (const [key, region] of Object.entries(countryRegionMap)) {
      if (loc.includes(key)) return region;
    }
    return 'global';
  };
  const userRegion = getUserRegion();
  const userSalary = salaryInfo ? salaryInfo[userRegion] : null;
  const regionLabels: Record<string, string> = { us: 'United States', eu: 'Europe', uk: 'United Kingdom', in: 'India', au: 'Australia', global: 'Global Average' };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ─── Hero: The Hook ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden" aria-label="Hero">
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-blue/8 via-neon-purple/5 to-transparent rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <LiveApplicationCounter className="mb-8" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-center">
              {firstName ? <>{firstName}, Stop Applying to Jobs.</> : <>Stop Applying to Jobs.</>}
              <br />
              <span className="gradient-text">Let AI Agents Do It For You.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
              {countryCode === 'IN' ? (
                <span className="sm:hidden">Resume upload karo. Target role batao. AI baaki sab handle karega.</span>
              ) : null}
              <span className={countryCode === 'IN' ? 'hidden sm:inline' : ''}>
                Upload your resume. Pick your target role. Our AI applies to 20 matching jobs &mdash; free. No credit card.
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/get-started"
                className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 shadow-lg shadow-neon-blue/20"
              >
                Start Free — 20 Job Applications <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-xs text-white/30">No credit card required</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Clear Value Proposition ─── */}
      <section className="relative py-16 sm:py-20 overflow-hidden" aria-label="How 3BOX AI Works">
        <div className="absolute inset-0 bg-grid opacity-10" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold mb-5">
              <Zap className="w-3.5 h-3.5" /> How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              4 Steps. <span className="gradient-text">Zero Effort.</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Upload once. AI handles the rest &mdash; finding, tailoring, and applying.
            </p>
          </motion.div>

          {/* 4-step flow */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-px bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-green/30 -translate-y-1/2 z-0" aria-hidden="true" />

            {[
              { step: '01', icon: Upload, title: 'Upload Resume', desc: 'Share your resume & goals', gradient: 'from-neon-blue to-cyan-400' },
              { step: '02', icon: Search, title: 'AI Finds Jobs', desc: 'Scout searches 6+ job platforms', gradient: 'from-neon-purple to-violet-400' },
              { step: '03', icon: Sparkles, title: 'AI Customizes', desc: 'Forge tailors your resume per job', gradient: 'from-amber-400 to-orange-400' },
              { step: '04', icon: Rocket, title: 'AI Applies', desc: 'Archer sends applications while you sleep', gradient: 'from-neon-green to-emerald-400' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative z-10 text-center"
              >
                <div className="glass p-5 sm:p-6 flex flex-col items-center hover:border-white/15 transition-all duration-300 group h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">Step {item.step}</div>
                  <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Chapter One: The Encounter (Hero) ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" aria-label="AI Career Coach Onboarding">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-neon-blue/8 via-neon-purple/4 to-transparent rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative w-full max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center">

            {/* ── Centered headline ── */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold mb-5">
                <Bot className="w-3.5 h-3.5" /> {step === 'resume' ? 'Upload your resume' : 'Tell us your target role'}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                <span className="gradient-text">{firstName ? `${firstName}, Let\u2019s Build` : 'Let\u2019s Build'}</span>
                <br />
                Your Career Profile.
              </h1>
              <p className="text-base sm:text-lg text-white/50 max-w-lg mx-auto mb-6">
                Answer a few quick questions and your AI team starts finding
                matching jobs and sending applications automatically.
              </p>

              {/* Agent mini-avatar row */}
              <div className="flex items-center justify-center gap-1.5">
                {AGENT_LIST.map((agent) => (
                  <Link key={agent.id} href={`/agents/${agent.id}`} className="relative group">
                    <AgentAvatar agentId={agent.id} size={24} autoSleep />
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                      <div className="bg-surface-100 border border-white/10 rounded px-2 py-0.5 whitespace-nowrap shadow-xl">
                        <span className="text-[10px] font-semibold text-white">{agent.displayName}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                <span className="ml-2 text-xs text-white/40 font-medium">Your AI team awaits</span>
              </div>
            </motion.div>

            {/* ── Form card ── */}
            <div className="w-full">

          {!alreadyDone ? (
            <div className="relative">
              {/* CortexAvatar — overlapping top of card */}
              <div className="flex justify-center mb-[-28px] relative z-10">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 blur-xl animate-pulse" />
                  <CortexAvatar size={56} expression={cortexExpression} />
                </div>
              </div>

              {/* Glass card container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass p-6 pt-10 relative overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5 pointer-events-none" />

                <div className="relative z-10">
                  {/* Speech bubble / typing indicator */}
                  <div className="min-h-[2.5rem] flex items-center justify-center mb-4">
                    <AnimatePresence mode="wait">
                      {isTyping ? (
                        <motion.div
                          key="typing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 rounded-2xl"
                        >
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </motion.div>
                      ) : messages.filter(m => m.from === 'nova').length > 0 ? (
                        <motion.div
                          key={`msg-${messages.filter(m => m.from === 'nova').length}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 rounded-2xl max-w-md"
                        >
                          <p className="text-sm text-white/60 leading-relaxed text-center">
                            {messages.filter(m => m.from === 'nova').slice(-1)[0]?.text}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  {/* Dynamic step heading */}
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={step}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="text-xl sm:text-2xl font-bold text-center mb-4"
                    >
                      {step === 'resume' ? (
                        <>Quick start with your <span className="gradient-text">resume</span></>
                      ) : step === 'intro' || step === 'role' ? (
                        <>What role should your agents <span className="gradient-text">target?</span></>
                      ) : step === 'experience' ? (
                        <>How much <span className="gradient-text">experience</span> do you have?</>
                      ) : step === 'status' ? (
                        <>What&apos;s your current <span className="gradient-text">situation?</span></>
                      ) : step === 'education' ? (
                        <>What&apos;s your <span className="gradient-text">education</span> level?</>
                      ) : step === 'skills' ? (
                        <>Select your <span className="gradient-text">skills</span> <span className="text-white/30 text-base font-normal">(or choose None)</span></>
                      ) : step === 'personal' ? (
                        <>Almost <span className="gradient-text">done!</span></>
                      ) : step === 'complete' ? (
                        <>Your agents are <span className="gradient-text">ready</span></>
                      ) : null}
                    </motion.h2>
                  </AnimatePresence>

                  {/* Input Area — changes based on step */}
                  <div className="w-full">
                    <AnimatePresence mode="wait">
                      {/* Resume Upload / Paste */}
                      {step === 'resume' && (
                        <motion.div key="resume-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          {/* Success state */}
                          {resumeParsed && (
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-neon-green/10 to-emerald-500/5 border border-neon-green/20 text-center">
                              <CheckCircle2 className="w-10 h-10 text-neon-green mx-auto mb-2" />
                              <h3 className="text-sm font-bold text-white mb-1">Resume Parsed Successfully!</h3>
                              <p className="text-xs text-white/40">Auto-filling your details...</p>
                            </div>
                          )}

                          {/* Parsing state */}
                          {resumeParsing && (
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-neon-blue/10 text-center">
                              <Loader2 className="w-8 h-8 text-neon-blue mx-auto mb-2 animate-spin" />
                              <h3 className="text-sm font-bold text-white mb-1">AI is reading your resume...</h3>
                              <p className="text-xs text-white/40">Extracting name, skills, experience, and more</p>
                            </div>
                          )}

                          {/* Error */}
                          {resumeError && (
                            <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{resumeError}</div>
                          )}

                          {/* Upload / Paste UI */}
                          {!resumeParsing && !resumeParsed && (
                            <div className="space-y-3">
                              {/* File Upload */}
                              {resumeMode !== 'paste' && (
                                <div>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx,.doc,.txt"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileSelect(file);
                                    }}
                                  />
                                  <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                                      dragOver
                                        ? 'border-neon-blue bg-neon-blue/5'
                                        : selectedFile
                                          ? 'border-neon-green/30 bg-neon-green/5'
                                          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                                    }`}
                                  >
                                    {selectedFile ? (
                                      <div className="flex items-center justify-center gap-3">
                                        <FileText className="w-7 h-7 text-neon-green" />
                                        <div className="text-left">
                                          <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                                          <p className="text-[11px] text-white/40">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                          className="ml-2 p-1 rounded-lg hover:bg-white/10"
                                        >
                                          <X className="w-4 h-4 text-white/40" />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-neon-blue' : 'text-white/20'}`} />
                                        <p className="text-sm font-medium text-white/60 mb-1">
                                          Drop your resume here or <span className="text-neon-blue">click to browse</span>
                                        </p>
                                        <p className="text-[11px] text-white/30">PDF, DOCX, or TXT (max 10MB)</p>
                                      </>
                                    )}
                                  </div>

                                  {selectedFile && (
                                    <button
                                      onClick={() => parseResume('file')}
                                      className="btn-primary w-full mt-2.5 flex items-center justify-center gap-2 text-sm"
                                    >
                                      <Zap className="w-4 h-4" /> Parse Resume with AI
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Divider */}
                              {!resumeMode && (
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-px bg-white/10" />
                                  <span className="text-[11px] text-white/30">or</span>
                                  <div className="flex-1 h-px bg-white/10" />
                                </div>
                              )}

                              {/* Paste Text */}
                              {resumeMode !== 'upload' && (
                                <div>
                                  {!resumeMode && (
                                    <button
                                      onClick={() => setResumeMode('paste')}
                                      className="w-full p-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/70"
                                    >
                                      <ClipboardPaste className="w-4 h-4" /> Paste resume as text
                                    </button>
                                  )}
                                  {resumeMode === 'paste' && (
                                    <>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-white/50 flex items-center gap-1.5">
                                          <ClipboardPaste className="w-3.5 h-3.5" /> Paste your resume text
                                        </label>
                                        <button onClick={() => { setResumeMode(null); setResumeText(''); }} className="text-[11px] text-white/30 hover:text-white/50">Cancel</button>
                                      </div>
                                      <textarea
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                        className="input-field resize-none text-xs w-full"
                                        rows={6}
                                        placeholder="Paste your entire resume text here..."
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => parseResume('text')}
                                        disabled={resumeText.trim().length < 30}
                                        className="btn-primary w-full mt-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-30"
                                      >
                                        <Zap className="w-4 h-4" /> Parse Resume with AI
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Skip button */}
                          {!resumeParsing && !resumeParsed && (
                            <button
                              onClick={() => {
                                addUserMessage('Skip — filling manually');
                                addCortexMessage("No problem! Let's start with your target role.");
                                proceedToStep('role');
                              }}
                              className="w-full mt-3 py-2 text-xs text-white/30 hover:text-white/50 transition-colors text-center"
                            >
                              Skip — I&apos;ll fill in manually
                            </button>
                          )}
                        </motion.div>
                      )}

                      {/* Role Input */}
                      {step === 'role' && (
                        <motion.div key="role-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                ref={inputRef}
                                value={roleInput}
                                onChange={(e) => { setRoleInput(e.target.value); setShowSuggestions(true); }}
                                onClick={() => setShowSuggestions(true)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRoleSubmit(); }}
                                className="input-field text-base pr-4 w-full"
                                placeholder="e.g. Software Engineer, Data Scientist..."
                              />
                              {showSuggestions && filteredRoles.length > 0 && (
                                <div ref={suggestionsRef} className="absolute z-20 left-0 right-0 top-full mt-1 bg-surface-50 border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                                  {filteredRoles.map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => { setRoleInput(role); setShowSuggestions(false); }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleRoleSubmit}
                              disabled={!roleInput.trim()}
                              className="btn-primary px-4 flex items-center gap-1 disabled:opacity-30"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {suggestedRoles.slice(0, 6).map((role) => (
                              <button
                                key={role}
                                onClick={() => { setRoleInput(role); setShowSuggestions(false); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-neon-blue hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all duration-200"
                              >
                                <Target className="w-3 h-3 inline mr-1 -mt-0.5 opacity-50" />{role}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Experience Level */}
                      {step === 'experience' && !isTyping && (
                        <motion.div key="exp-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {experienceLevels.map((lvl) => (
                              <button
                                key={lvl.value}
                                onClick={() => handleExperienceSelect(lvl)}
                                className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-neon-blue/40 hover:bg-neon-blue/5 transition-all text-left group"
                              >
                                <div className="text-sm font-medium group-hover:text-neon-blue transition-colors">{lvl.label}</div>
                                <div className="text-xs text-white/30">{lvl.desc}</div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Current Status */}
                      {step === 'status' && !isTyping && (
                        <motion.div key="status-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="flex flex-wrap gap-2">
                            {currentStatuses.map((s) => (
                              <button
                                key={s.value}
                                onClick={() => handleStatusSelect(s)}
                                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-neon-purple/40 hover:bg-neon-purple/5 transition-all text-sm font-medium"
                              >
                                {s.emoji} {s.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Education */}
                      {step === 'education' && !isTyping && (
                        <motion.div key="edu-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="flex flex-wrap gap-2">
                            {educationLevels.map((edu) => (
                              <button
                                key={edu}
                                onClick={() => handleEducationSelect(edu)}
                                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/40 hover:bg-amber-400/5 transition-all text-sm font-medium"
                              >
                                {edu}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Skills */}
                      {step === 'skills' && !isTyping && (
                        <motion.div key="skills-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <button
                              onClick={() => setSelectedSkills((prev) => prev.includes('None') ? prev.filter((s) => s !== 'None') : ['None'])}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                selectedSkills.includes('None')
                                  ? 'bg-neon-blue/15 border border-neon-blue/40 text-neon-blue'
                                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                              }`}
                            >
                              {selectedSkills.includes('None') && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
                              None / Not Sure
                            </button>
                            {suggestedSkills.map((skill) => {
                              const sel = selectedSkills.includes(skill);
                              return (
                                <button
                                  key={skill}
                                  onClick={() => setSelectedSkills((prev) => {
                                    const filtered = prev.filter((s) => s !== 'None');
                                    return sel ? filtered.filter((s) => s !== skill) : [...filtered, skill];
                                  })}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    sel && !selectedSkills.includes('None')
                                      ? 'bg-neon-green/15 border border-neon-green/40 text-neon-green'
                                      : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                                  }`}
                                >
                                  {sel && !selectedSkills.includes('None') && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                          {(selectedSkills.includes('None') || selectedSkills.length >= 2) && (
                            <button onClick={handleSkillsDone} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                              {selectedSkills.includes('None')
                                ? <>Continue without skills <ArrowRight className="w-4 h-4" /></>
                                : <>Continue with {selectedSkills.length} skills <ArrowRight className="w-4 h-4" /></>
                              }
                            </button>
                          )}
                        </motion.div>
                      )}

                      {/* Personal Info */}
                      {step === 'personal' && !isTyping && (
                        <motion.div key="personal-input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="space-y-3">
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                              <input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="input-field pl-10 text-sm w-full"
                                placeholder="Your full name"
                                autoFocus
                              />
                            </div>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                              <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handlePersonalDone(); }}
                                className="input-field pl-10 text-sm w-full"
                                placeholder="City, Country"
                              />
                            </div>
                            <button
                              onClick={handlePersonalDone}
                              disabled={!fullName.trim() || !location.trim()}
                              className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-30"
                            >
                              See My Career Preview <Sparkles className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Complete — Personalized Career Preview + Signup CTA */}
                      {step === 'complete' && !isTyping && (
                        <motion.div key="complete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{fullName.split(' ')[0]}, your agents are ready!</div>
                                <div className="text-xs text-white/40">Future {targetRole} — {location}</div>
                              </div>
                            </div>

                            {salaryInfo && userSalary && (
                              <div className="p-3 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-blue/10 border border-neon-green/20">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-[10px] text-white/40 mb-0.5">Top {targetRole} salary in {regionLabels[userRegion]}</div>
                                    <div className="text-xl font-bold text-neon-green">{userSalary}</div>
                                  </div>
                                  <DollarSign className="w-8 h-8 text-neon-green/30" />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                <Brain className="w-4 h-4 text-neon-blue mx-auto mb-1" />
                                <div className="text-xs text-white/30">Skills Mapped</div>
                                <div className="text-sm font-bold">{selectedSkills.length}</div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                <FileText className="w-4 h-4 text-neon-green mx-auto mb-1" />
                                <div className="text-xs text-white/30">ATS Resume</div>
                                <div className="text-sm font-bold text-neon-green">Ready</div>
                              </div>
                            </div>

                            <Link href="/get-started" className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
                              Get Started Free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <p className="text-center text-[10px] text-white/20">No credit card required. AI starts applying in 60 seconds.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* Already completed — show compact CTA */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back{fullName ? `, ${fullName.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-white/40 mb-6">Your {targetRole} career profile is ready. Get your free applications now.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/get-started" className="btn-primary text-sm flex items-center gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={handleRestart} className="btn-secondary text-sm">
                  Start Over
                </button>
              </div>
            </motion.div>
          )}

            </div>{/* end form card */}
          </div>{/* end centered column */}
        </div>
      </section>

      {/* ─── Trust & Safety ─── */}
      <section className="relative py-16 sm:py-20 overflow-hidden" aria-label="Trust and Safety">
        <div className="absolute inset-0 bg-grid opacity-10" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-green/5 via-transparent to-transparent rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold mb-5">
              <ShieldCheck className="w-3.5 h-3.5" /> Built for trust
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">You Stay In <span className="gradient-text">Control</span></h2>
            <p className="text-white/40 max-w-lg mx-auto">
              AI is powerful &mdash; but your career is personal. Here&apos;s how we keep you safe.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {[
              {
                icon: Eye,
                title: 'Human Approval Mode',
                desc: 'Review every application before it\u2019s sent. Switch between Copilot, Autopilot, or Full Agent mode at any time.',
                gradient: 'from-neon-blue to-cyan-400',
              },
              {
                icon: Shield,
                title: 'Secure System',
                desc: 'No spam. No mass blasts. Each application is quality-checked by Sentinel before submission.',
                gradient: 'from-neon-purple to-violet-400',
              },
              {
                icon: Lock,
                title: 'Data Protection',
                desc: 'Your data is encrypted, never shared, and you can delete it anytime. GDPR compliant.',
                gradient: 'from-neon-green to-emerald-400',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="glass p-6 h-full hover:border-white/15 transition-all duration-300 group text-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Impact Numbers ─── */}
      <section className="relative py-16 sm:py-20 bg-surface-50 overflow-hidden" aria-label="Real Results">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-5">
              <BarChart3 className="w-3.5 h-3.5" /> Real results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Numbers Don&apos;t <span className="gradient-text">Lie</span></h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { value: '2,400+', label: 'Jobs Matched', color: 'from-neon-blue to-cyan-400' },
              { value: '94%', label: 'Got Hired Faster', color: 'from-neon-green to-emerald-400' },
              { value: '14 Days', label: 'Avg. to First Interview', color: 'from-neon-purple to-violet-400' },
              { value: '4.9\u2605', label: 'Rating from Users', color: 'from-amber-400 to-orange-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Chapter Two: The Assembly (Agent Team — Structured Diagram) ─── */}
      <section className="py-20" aria-label="Meet Your AI Career Team">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-xs font-semibold mb-4">
              <Bot className="w-3.5 h-3.5" /> Your AI team
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">6 AI Agents <span className="gradient-text">Working For You</span></h2>
            <p className="text-white/40 max-w-lg mx-auto">
              One coordinator. Six specialists. Working in perfect sync.
            </p>
          </motion.div>

          {/* ── Desktop: Orbital Constellation ── */}
          <div className="hidden md:flex justify-center mb-8">
            <div className="relative" style={{ width: 520, height: 520 }}>
              {/* Rotating dashed orbit circle */}
              <motion.div
                className="absolute inset-[40px] rounded-full border border-dashed border-white/[0.06]"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              />

              {/* SVG connecting lines from center to each agent */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                {AGENT_LIST.map((_, i) => {
                  const a = (i * 60 - 90) * (Math.PI / 180);
                  const r = 160;
                  return (
                    <line
                      key={i}
                      x1="50%" y1="50%"
                      x2={260 + r * Math.cos(a)} y2={260 + r * Math.sin(a)}
                      stroke="url(#orbital-line-grad)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.15"
                    />
                  );
                })}
                <defs>
                  <linearGradient id="orbital-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Cortex at center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Link href="/agents/cortex" className="group/cortex relative block">
                  <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 blur-xl animate-pulse" />
                  <CortexAvatar size={56} pulse />
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 opacity-0 group-hover/cortex:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                    <div className="bg-surface-100/95 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-center min-w-[140px]">
                      <div className="text-xs font-semibold text-white">{COORDINATOR.displayName}</div>
                      <div className="text-[10px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#a855f7]">{COORDINATOR.role}</div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* 6 Orbiting Agents */}
              {AGENT_LIST.map((agent, i) => (
                <OrbitingAgent key={agent.id} agent={agent} index={i} />
              ))}
            </div>
          </div>

          {/* ── Mobile: Cortex + Grid ── */}
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center mb-6"
            >
              <Link href="/agents/cortex" className="group">
                <div className="glass p-5 flex items-center gap-4 hover:border-white/15 transition-all duration-300">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 blur-xl animate-pulse" />
                    <CortexAvatar size={48} pulse />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold group-hover:text-neon-blue transition-colors">{COORDINATOR.displayName}</h3>
                    <p className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#a855f7]">{COORDINATOR.role}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              {AGENT_LIST.map((agent, i) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="glass p-4 flex flex-col items-center text-center hover:border-white/15 transition-all duration-300 group h-full"
                  >
                    <AgentAvatar agentId={agent.id} size={40} autoSleep />
                    <h3 className="text-xs font-semibold mt-2.5 group-hover:text-white transition-colors">{agent.displayName}</h3>
                    <span className={`text-[10px] font-medium ${agent.color}`}>{agent.role}</span>
                    <span className="text-[9px] text-white/30 mt-1 leading-tight italic">{agent.storyLine}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Cortex Origin Story ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden">
              {/* Ambient gradient border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00d4ff]/20 via-[#a855f7]/20 to-[#00d4ff]/20 p-px">
                <div className="w-full h-full rounded-2xl bg-surface-50" />
              </div>
              <div className="relative p-6 sm:p-8">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex-shrink-0 mt-1">
                    <CortexAvatar size={48} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#a855f7]">
                        The Origin of Cortex
                      </h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#00d4ff]/20 to-transparent" />
                    </div>
                    <p className="text-xs sm:text-sm text-white/45 leading-relaxed mb-3">
                      <span className="text-white/60 font-medium">In the beginning, there was only Cortex.</span> One AI. One mission. Every job board, every ATS wall, every recruiter inbox — Cortex fought them all <em>alone</em>. Night after night, scanning thousands of listings, rewriting resumes at 3 AM, tailoring cover letters by dawn. It worked. But the battlefield was infinite.
                    </p>
                    <p className="text-xs sm:text-sm text-white/45 leading-relaxed mb-3">
                      Then one night, something broke. Processing threads burned. Response times doubled. And for the first time — <span className="text-rose-400/80">Cortex missed a deadline</span>. Someone lost their dream job. That moment changed everything.
                    </p>
                    <p className="text-xs sm:text-sm text-white/45 leading-relaxed mb-4">
                      Cortex made a decision no AI had made before: <span className="text-white/60 font-medium">it created its own team</span>. Six specialists, each forged from Cortex&apos;s own knowledge — Scout to hunt, Forge to craft, Sentinel to guard, Archer to strike, Atlas to prepare, Sage to teach. The ninja who once fought alone now commands an army.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {AGENT_LIST.slice(0, 6).map((agent) => (
                          <div key={agent.id} className="ring-2 ring-surface-50 rounded-full">
                            <AgentAvatar agentId={agent.id} size={18} />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/30 italic">
                        &ldquo;The ninja never sleeps — because the team means he never carries the weight alone again.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ─── Chapter Four: The Journey (Agent Pipeline) ─── */}
      <section className="py-20 bg-surface-50 overflow-hidden" aria-label="A Night in the Life">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold mb-4">
              <Clock className="w-3.5 h-3.5" /> While you sleep
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">What Happens <span className="gradient-text">While You Sleep</span></h2>
            <p className="text-white/40">While you rest, an entire career operation unfolds. Here is the timeline.</p>
          </motion.div>

          {/* Pipeline Flow */}
          {(() => {
            const pipelineSteps = [
              { label: '11:00 PM — You Rest', time: '11:00 PM', agentId: null as (null | 'cortex' | 'scout' | 'forge' | 'sentinel' | 'archer' | 'atlas'), icon: Moon, color: 'from-slate-500/20 to-slate-400/20' },
              { label: '11:15 PM — Scout Discovers', time: '11:15 PM', agentId: 'scout' as const, icon: null, color: 'from-blue-500/20 to-cyan-500/20' },
              { label: '12:00 AM — Forge Optimizes', time: '12:00 AM', agentId: 'forge' as const, icon: null, color: 'from-orange-500/20 to-amber-500/20' },
              { label: '1:30 AM — Sentinel Reviews', time: '1:30 AM', agentId: 'sentinel' as const, icon: null, color: 'from-rose-500/20 to-pink-500/20' },
              { label: '3:00 AM — Archer Applies', time: '3:00 AM', agentId: 'archer' as const, icon: null, color: 'from-green-500/20 to-emerald-500/20' },
              { label: '5:00 AM — Atlas Preps', time: '5:00 AM', agentId: 'atlas' as const, icon: null, color: 'from-purple-500/20 to-violet-500/20' },
              { label: '7:00 AM — You Wake Up', time: '7:00 AM', agentId: null, icon: Sparkles, color: 'from-neon-green/20 to-emerald-400/20' },
            ];
            return (
              <>
                {/* Desktop: Horizontal Flow */}
                <div className="hidden lg:flex items-center justify-center gap-3">
                  {pipelineSteps.map((ps, i) => (
                    <motion.div
                      key={ps.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex items-center gap-1"
                    >
                      {ps.agentId ? (
                        <Link href={`/agents/${ps.agentId}`} className="flex flex-col items-center text-center group hover:scale-105 transition-transform">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${ps.color} flex items-center justify-center mb-2 border border-white/[0.06] group-hover:border-white/15`}>
                            <AgentAvatar agentId={ps.agentId} size={32} />
                          </div>
                          <span className="text-xs font-medium text-white/70 whitespace-nowrap">{ps.label}</span>
                        </Link>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${ps.color} flex items-center justify-center mb-2 border border-white/[0.06]`}>
                            {ps.icon && <ps.icon className="w-6 h-6 text-white/70" />}
                          </div>
                          <span className="text-xs font-medium text-white/70 whitespace-nowrap">{ps.label}</span>
                        </div>
                      )}
                      {i < pipelineSteps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-[-18px]" />
                      )}
                    </motion.div>
                  ))}
                </div>
                {/* Mobile/Tablet: Vertical Flow */}
                <div className="lg:hidden relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-neon-blue/20 to-neon-green/20" aria-hidden="true" />
                  <div className="space-y-5">
                    {pipelineSteps.map((ps, i) => (
                      <motion.div
                        key={ps.label}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="flex items-center gap-4"
                      >
                        {ps.agentId ? (
                          <Link href={`/agents/${ps.agentId}`} className="contents">
                            <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${ps.color} flex items-center justify-center border border-white/[0.06]`}>
                              <AgentAvatar agentId={ps.agentId} size={28} />
                            </div>
                            <span className="text-sm font-medium text-white/70">{ps.label}</span>
                          </Link>
                        ) : (
                          <>
                            <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${ps.color} flex items-center justify-center border border-white/[0.06]`}>
                              {ps.icon && <ps.icon className="w-5 h-5 text-white/70" />}
                            </div>
                            <span className="text-sm font-medium text-white/70">{ps.label}</span>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────── */}
      {/* ─── Chapter Six: The Questions ─── */}
      <section className="py-20" aria-label="You Probably Have Questions">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-medium mb-4">
              <Shield className="w-3.5 h-3.5" /> FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Common <span className="gradient-text">Questions</span></h2>
            <p className="text-white/40">Everything you need to know before getting started.</p>
          </motion.div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-5 pb-4 text-sm text-white/40 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Chapter Five: The Proof (Reviews — Scrolling Wall) ─── */}
      <section className="py-20 bg-surface-50 overflow-hidden" aria-label="Their Story Could Be Yours">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-4">
              <Star className="w-3.5 h-3.5" /> Real results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Real Results From <span className="gradient-text">Real Job Seekers</span>
            </h2>
            <p className="text-white/40 mb-2">See how AI auto-apply is changing careers.</p>
            <p className="text-xs text-white/20">{allReviews.length}+ stories and counting</p>
          </motion.div>
        </div>

        {/* ── Scrolling Review Wall ── */}
        <div className="relative mt-10">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-surface-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-surface-50 to-transparent z-10 pointer-events-none" />

          {/* Row 1 — scrolls left */}
          <div className="mb-4">
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            >
              {[...allReviews.slice(0, 10), ...allReviews.slice(0, 10)].map((review, i) => (
                <div
                  key={`r1-${i}`}
                  className="w-[320px] sm:w-[360px] flex-shrink-0 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center text-[10px] font-bold text-white/70 flex-shrink-0">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate">{review.name}</h4>
                      <p className="text-[10px] text-white/40">{review.role}{review.country ? ` · ${review.country}` : ''}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-2.5 line-clamp-3">{review.text}</p>
                  {review.transformation && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                      <TrendingUp className="w-2.5 h-2.5 text-neon-green" />
                      <span className="text-[10px] font-semibold text-neon-green">{review.transformation}</span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Row 2 — scrolls right (reverse) */}
          <div className="mb-4">
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
            >
              {[...allReviews.slice(10, 20), ...allReviews.slice(10, 20)].map((review, i) => (
                <div
                  key={`r2-${i}`}
                  className="w-[320px] sm:w-[360px] flex-shrink-0 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple/20 to-amber-400/20 flex items-center justify-center text-[10px] font-bold text-white/70 flex-shrink-0">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate">{review.name}</h4>
                      <p className="text-[10px] text-white/40">{review.role}{review.country ? ` · ${review.country}` : ''}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-2.5 line-clamp-3">{review.text}</p>
                  {review.transformation && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                      <TrendingUp className="w-2.5 h-2.5 text-neon-green" />
                      <span className="text-[10px] font-semibold text-neon-green">{review.transformation}</span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Row 3 — scrolls left (slower) */}
          <div className="mb-4">
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
            >
              {[...allReviews.slice(20, 30), ...allReviews.slice(20, 30)].map((review, i) => (
                <div
                  key={`r3-${i}`}
                  className="w-[320px] sm:w-[360px] flex-shrink-0 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center text-[10px] font-bold text-white/70 flex-shrink-0">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate">{review.name}</h4>
                      <p className="text-[10px] text-white/40">{review.role}{review.country ? ` · ${review.country}` : ''}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-2.5 line-clamp-3">{review.text}</p>
                  {review.transformation && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                      <TrendingUp className="w-2.5 h-2.5 text-neon-green" />
                      <span className="text-[10px] font-semibold text-neon-green">{review.transformation}</span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Row 4 — scrolls right (fastest) */}
          <div>
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            >
              {[...allReviews.slice(30, 38), ...allReviews.slice(30, 38)].map((review, i) => (
                <div
                  key={`r4-${i}`}
                  className="w-[320px] sm:w-[360px] flex-shrink-0 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-400/20 flex items-center justify-center text-[10px] font-bold text-white/70 flex-shrink-0">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate">{review.name}</h4>
                      <p className="text-[10px] text-white/40">{review.role}{review.country ? ` · ${review.country}` : ''}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-2.5 line-clamp-3">{review.text}</p>
                  {review.transformation && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                      <TrendingUp className="w-2.5 h-2.5 text-neon-green" />
                      <span className="text-[10px] font-semibold text-neon-green">{review.transformation}</span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Counter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-6 mt-10 text-center"
        >
          <div>
            <div className="text-2xl sm:text-3xl font-bold gradient-text">{allReviews.length}+</div>
            <div className="text-[10px] text-white/30">Success Stories</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-neon-green">94%</div>
            <div className="text-[10px] text-white/30">Got Hired Faster</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400">4.9</div>
            <div className="text-[10px] text-white/30">Average Rating</div>
          </div>
        </motion.div>
      </section>

      {/* ─── Placement Cell Banner (India-only) ─── */}
      <PlacementCellBanner countryCode={countryCode} />

      {/* ─── Chapter Seven: The First Step (Closing CTA) ─── */}
      <section className="relative py-24 sm:py-32 overflow-hidden" aria-label="Your Story Starts Now">
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-radial from-neon-blue/8 via-neon-purple/5 to-transparent rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5" /> Start free
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Your First 20 Applications<br />
              Are <span className="gradient-text">Free</span>.
            </h2>
            <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
              {countryCode === 'IN' ? (
                <span className="sm:hidden">Pehle 20 applications bilkul free. Sochna kya?</span>
              ) : null}
              <span className={countryCode === 'IN' ? 'hidden sm:inline' : ''}>
                Upload your resume. Pick a role. AI does the rest in 60 seconds.
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/get-started"
                className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 shadow-lg shadow-neon-blue/20"
              >
                {firstName ? `${firstName}, ` : ''}Start Free — 20 Job Applications <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-xs text-white/30">No credit card required</p>
            </div>

            {/* Mini agent row as visual anchor */}
            <div className="flex items-center justify-center gap-2 mt-12">
              {AGENT_LIST.map((agent) => (
                <div key={agent.id} className="opacity-40 hover:opacity-100 transition-opacity">
                  <AgentAvatar agentId={agent.id} size={20} />
                </div>
              ))}
              <div className="ml-1 opacity-40 hover:opacity-100 transition-opacity">
                <CortexAvatar size={22} />
              </div>
            </div>
            <p className="text-[10px] text-white/20 mt-3">7 AI agents working together to land your dream job.</p>
          </motion.div>
        </div>
      </section>

      <ResumePreviewSection />
      <Footer />
    </div>
  );
}
