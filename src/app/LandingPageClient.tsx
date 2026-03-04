'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Brain, Target, BookOpen, FileText,
  ArrowRight, Zap, TrendingUp,
  CheckCircle2, BarChart3, Bot, Cpu, Award,
  DollarSign, Send, User, MapPin
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HoraceAvatar, { type HoraceExpression } from '@/components/brand/HoraceAvatar';

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
const demoResponses: Record<string, (ctx: any) => string> = {
  role: (ctx) => {
    const salary = roleSalaryMap[ctx.targetRole];
    return salary ? `Great pick! Top ${ctx.targetRole}s earn up to ${salary.us} in the US.` : `${ctx.targetRole} — exciting choice! Let's map your path.`;
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

// ─── Landing Page Constants ──────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};


const howItWorks = [
  { step: '01', title: 'Tell us your dream role', desc: 'Share your career goal — any field, any industry. Our AI coach personalizes every step from here.', icon: Target, color: 'from-neon-blue to-cyan-400' },
  { step: '02', title: 'AI skill assessment + human review', desc: 'AI evaluates your skills with real-world tasks. A real human expert reviews results before you move forward — no AI-only guesswork.', icon: Brain, color: 'from-neon-purple to-violet-400' },
  { step: '03', title: 'Learn new skills & close gaps', desc: 'Get a personalized learning path with curated courses, hands-on projects, and milestones tailored to your skill gaps.', icon: BookOpen, color: 'from-amber-400 to-orange-400' },
  { step: '04', title: 'Build an ATS-ready resume', desc: 'AI generates a resume optimized for Applicant Tracking Systems — keyword-matched, role-tailored, and formatted to pass every scanner.', icon: FileText, color: 'from-neon-green to-emerald-400' },
  { step: '05', title: 'Get matched & auto-apply', desc: 'AI finds best-fit jobs, scores your match, and can auto-apply with personalized cover letters for every role.', icon: Zap, color: 'from-rose-400 to-pink-500' },
];

const topSalaryRoles = [
  { role: 'Data Scientist', icon: Brain, us: 'Up to $200K', eu: 'Up to €130K', growth: '+31%' },
  { role: 'Product Manager', icon: Target, us: 'Up to $190K', eu: 'Up to €130K', growth: '+24%' },
  { role: 'Software Engineer', icon: Cpu, us: 'Up to $180K', eu: 'Up to €120K', growth: '+25%' },
  { role: 'Legal Advisor', icon: FileText, us: 'Up to $180K', eu: 'Up to €110K', growth: '+15%' },
  { role: 'Financial Analyst', icon: BarChart3, us: 'Up to $150K', eu: 'Up to €95K', growth: '+18%' },
  { role: 'Marketing Manager', icon: Zap, us: 'Up to $145K', eu: 'Up to €95K', growth: '+19%' },
];

// ─── Conversational Steps ────────────────────

type ConvoStep = 'intro' | 'role' | 'experience' | 'status' | 'education' | 'skills' | 'personal' | 'complete';

const stepOrder: ConvoStep[] = ['intro', 'role', 'experience', 'status', 'education', 'skills', 'personal', 'complete'];

interface Message {
  from: 'nova' | 'user';
  text: string;
  type?: 'question' | 'response' | 'insight';
}

// ─── Main Component ──────────────────────────

export default function LandingPageClient() {
  const router = useRouter();
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

  // Collected data
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');
  const [status, setStatus] = useState('');
  const [education, setEducation] = useState('');

  // Check if user already completed
  const [alreadyDone, setAlreadyDone] = useState(false);

  // Horace expression state (reactive eye animations)
  const [horaceExpression, setHoraceExpression] = useState<HoraceExpression>('normal');
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const triggerExpression = (expr: HoraceExpression, duration = 2500) => {
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    setHoraceExpression(expr);
    expressionTimerRef.current = setTimeout(() => setHoraceExpression('normal'), duration);
  };

  useEffect(() => {
    return () => { if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current); };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nxted_onboarding_profile');
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
          text: "Hey! I'm Horace, your career coach. Let's find the perfect path for you.",
          type: 'question',
        }]);
        setTimeout(() => setStep('role'), 600);
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

  const addHoraceMessage = (text: string, type: Message['type'] = 'response') => {
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

  // ─── Step Handlers ──────────────────────

  const handleRoleSubmit = async () => {
    if (!roleInput.trim()) return;
    const role = roleInput.trim();
    setTargetRole(role);
    addUserMessage(role);
    setRoleInput('');
    setShowSuggestions(false);
    triggerExpression('heart');

    const aiMsg = await getAIResponse('role', role, { targetRole: role });
    addHoraceMessage(aiMsg);
    proceedToStep('experience');
  };

  const handleExperienceSelect = async (lvl: typeof experienceLevels[0]) => {
    setExperience(lvl.value);
    addUserMessage(lvl.label);
    triggerExpression('star');

    const aiMsg = await getAIResponse('experience', lvl.value, { targetRole, experience: lvl.value });
    addHoraceMessage(aiMsg);
    proceedToStep('status');
  };

  const handleStatusSelect = async (s: typeof currentStatuses[0]) => {
    setStatus(s.value);
    addUserMessage(`${s.emoji} ${s.label}`);
    triggerExpression('happy');

    const aiMsg = await getAIResponse('status', s.value, { targetRole, experience, status: s.value });
    addHoraceMessage(aiMsg);
    proceedToStep('education');
  };

  const handleEducationSelect = async (edu: string) => {
    setEducation(edu);
    addUserMessage(edu);
    triggerExpression('thinking');

    const aiMsg = await getAIResponse('education', edu, { targetRole, experience, status, education: edu });
    addHoraceMessage(aiMsg);
    proceedToStep('skills');
  };

  const handleSkillsDone = async () => {
    if (selectedSkills.length < 2) return;
    addUserMessage(selectedSkills.join(', '));
    triggerExpression('star');

    const aiMsg = await getAIResponse('skills', selectedSkills.join(', '), { targetRole, experience, status, education, skills: selectedSkills });
    addHoraceMessage(aiMsg);
    proceedToStep('personal');
  };

  const handlePersonalDone = () => {
    if (!fullName.trim() || !location.trim()) return;
    addUserMessage(`${fullName} from ${location}`);
    triggerExpression('heart');

    // Save to localStorage
    const profile = {
      fullName, location, phone: '', linkedin: '', bio: '',
      targetRole, experienceLevel: experience, currentStatus: status,
      educationLevel: education, fieldOfStudy: '', institution: '', graduationYear: '',
      skills: selectedSkills, experiences: [],
    };
    localStorage.setItem('nxted_onboarding_profile', JSON.stringify(profile));
    localStorage.setItem('nxted_target_role', targetRole);
    localStorage.setItem('nxted_interests', JSON.stringify(selectedSkills.slice(0, 5)));
    localStorage.setItem('nxted_user_location', location);
    localStorage.setItem('nxted_skill_scores', JSON.stringify(
      selectedSkills.reduce((acc, skill) => {
        acc[skill] = experience === 'fresher' ? 30 : experience === '0-1' ? 40 : experience === '1-3' ? 55 : experience === '3-5' ? 65 : experience === '5-10' ? 75 : 85;
        return acc;
      }, {} as Record<string, number>)
    ));
    const resumeData = {
      personalInfo: { fullName, email: '', phone: '', location, linkedin: '' },
      summary: `${experience === 'fresher' ? 'Aspiring' : 'Experienced'} ${targetRole} passionate about ${selectedSkills.slice(0, 3).join(', ')}.`,
      experience: [],
      education: { level: education, field: '', institution: '', year: '' },
      skills: selectedSkills,
      targetRole,
    };
    localStorage.setItem('nxted_resume_draft', JSON.stringify(resumeData));

    // Compute salary message based on user's country
    const region = (() => {
      const loc = location.toLowerCase();
      for (const [key, r] of Object.entries(countryRegionMap)) { if (loc.includes(key)) return r; }
      return 'global' as const;
    })();
    const sal = roleSalaryMap[targetRole];
    const salaryMsg = sal ? ` Top ${targetRole}s earn up to ${sal[region]} in your area.` : '';
    addHoraceMessage(`${fullName.split(' ')[0]}, your profile is ready!${salaryMsg} Sign up to unlock your career plan.`);
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
    localStorage.removeItem('nxted_onboarding_profile');
    localStorage.removeItem('nxted_target_role');
    setTimeout(() => {
      setMessages([{ from: 'nova', text: "Hey! I'm Horace, your career coach. Let's find the perfect path for you.", type: 'question' }]);
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

      {/* ─── Hero: Conversational AI Onboarding ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" aria-label="AI Career Coach Onboarding">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-neon-blue/8 via-neon-purple/4 to-transparent rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative w-full max-w-2xl mx-auto px-4">
          {!alreadyDone ? (
            <div className="flex flex-col items-center">
              {/* Horace speaking — avatar + speech bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-end gap-2.5 mb-5 w-full max-w-lg"
              >
                <div className="flex-shrink-0">
                  <HoraceAvatar size={40} expression={horaceExpression} />
                </div>
                <div className="min-h-[2.5rem] flex items-center flex-1">
                  <AnimatePresence mode="wait">
                    {isTyping ? (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-bl-md"
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
                        className="bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-bl-md"
                      >
                        <p className="text-sm text-white/60 leading-relaxed">
                          {messages.filter(m => m.from === 'nova').slice(-1)[0]?.text}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Dynamic step heading */}
              <AnimatePresence mode="wait">
                <motion.h1
                  key={step}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-2xl sm:text-3xl font-bold text-center mb-4"
                >
                  {step === 'intro' || step === 'role' ? (
                    <>What do you want to <span className="gradient-text">become?</span></>
                  ) : step === 'experience' ? (
                    <>How much <span className="gradient-text">experience</span> do you have?</>
                  ) : step === 'status' ? (
                    <>What&apos;s your current <span className="gradient-text">situation?</span></>
                  ) : step === 'education' ? (
                    <>What&apos;s your <span className="gradient-text">education</span> level?</>
                  ) : step === 'skills' ? (
                    <>Select your <span className="gradient-text">skills</span> <span className="text-white/30 text-lg font-normal">(2+)</span></>
                  ) : step === 'personal' ? (
                    <>Almost <span className="gradient-text">done!</span></>
                  ) : step === 'complete' ? (
                    <>Your career <span className="gradient-text">profile</span></>
                  ) : null}
                </motion.h1>
              </AnimatePresence>

              {/* Input Area — changes based on step */}
              <div className="w-full">
                <AnimatePresence mode="wait">
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
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {suggestedRoles.slice(0, 6).map((role) => (
                          <button
                            key={role}
                            onClick={() => { setRoleInput(role); setShowSuggestions(false); }}
                            className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
                          >
                            {role}
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
                        {suggestedSkills.map((skill) => {
                          const sel = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => setSelectedSkills((prev) => sel ? prev.filter((s) => s !== skill) : [...prev, skill])}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                sel
                                  ? 'bg-neon-green/15 border border-neon-green/40 text-neon-green'
                                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                              }`}
                            >
                              {sel && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                      {selectedSkills.length >= 2 && (
                        <button onClick={handleSkillsDone} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                          Continue with {selectedSkills.length} skills <ArrowRight className="w-4 h-4" />
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
                      <div className="glass p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{fullName.split(' ')[0]}, your profile is ready!</div>
                            <div className="text-xs text-white/40">Future {targetRole} — {location}</div>
                          </div>
                        </div>

                        {/* Country-specific salary highlight */}
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

                        <Link href="/signup" className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
                          Start as {targetRole} <ArrowRight className="w-5 h-5" />
                        </Link>
                        <p className="text-center text-[10px] text-white/20">Free forever. No credit card. Your data is saved.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Already completed — show compact CTA */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back{fullName ? `, ${fullName.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-white/40 mb-6">Your {targetRole} career profile is ready. Sign up to unlock everything.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/signup" className="btn-primary text-sm flex items-center gap-2">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={handleRestart} className="btn-secondary text-sm">
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────── */}
      <section className="py-20" aria-label="How AI Career Platform Works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-white/40">AI-powered. Human-verified. Five simple steps.</p>
          </motion.div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-neon-blue/40 via-neon-purple/40 to-neon-green/40 hidden sm:block" aria-hidden="true" />
            <div className="space-y-6">
              {howItWorks.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex items-start gap-4 sm:gap-5"
                  >
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-base font-semibold mb-0.5">{item.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Free AI Career Tools ───────────────────── */}
      <section className="py-20 bg-surface-50" aria-label="Free AI Career Tools">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> 100% Free
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Free AI Career Tools</h2>
            <p className="text-white/40">No signup required. Powered by AI.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: FileText,
                title: 'ATS Resume Checker',
                desc: 'Paste your resume and get instant ATS compatibility score with improvement suggestions.',
                cta: 'Check My Resume',
                href: '/tools/ats-checker',
                color: 'from-neon-blue to-cyan-400',
              },
              {
                icon: Award,
                title: 'Free Resume Builder',
                desc: 'Build a clean, professional resume with live preview and PDF download. No signup required.',
                cta: 'Build My Resume',
                href: '/tools/resume-builder',
                color: 'from-neon-purple to-violet-400',
              },
              {
                icon: DollarSign,
                title: 'Salary Estimator',
                desc: 'Get AI-powered salary estimates based on role, location, and experience.',
                cta: 'Estimate Salary',
                href: '/tools/salary-estimator',
                color: 'from-neon-green to-emerald-400',
              },
            ].map((tool, i) => (
              <motion.div
                key={tool.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all group flex flex-col"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-2">{tool.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-5 flex-1">{tool.desc}</p>
                <Link
                  href={tool.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-neon-blue hover:text-neon-blue/80 transition-colors group-hover:gap-2.5"
                >
                  {tool.cta} <ArrowRight className="w-4 h-4 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Salary Highlights 2026 ─────────────────── */}
      <section className="py-20" aria-label="High Paying Careers 2026">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Highest Paying <span className="gradient-text">Careers in 2026</span>
            </h2>
            <p className="text-white/40">See what top roles pay. NXTED AI helps you get there.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSalaryRoles.map((role, i) => (
              <motion.div key={role.role} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-neon-green/20 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-green/20 to-emerald-500/10 flex items-center justify-center">
                    <role.icon className="w-4 h-4 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{role.role}</h3>
                    <span className="text-[10px] text-neon-green font-medium">{role.growth} growth</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                    <div className="text-[9px] text-white/30 mb-0.5">US</div>
                    <div className="text-xs font-bold text-white/80">{role.us}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                    <div className="text-[9px] text-white/30 mb-0.5">EU</div>
                    <div className="text-xs font-bold text-white/80">{role.eu}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-10">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn-primary text-sm inline-flex items-center gap-2">
              Start Your Career Journey <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
