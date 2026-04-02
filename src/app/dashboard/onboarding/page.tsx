'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, Sparkles, ArrowRight, ArrowLeft,
  Check, MapPin, Plus, X, Loader2, Rocket,
  DollarSign, FileText, Upload, ClipboardPaste, Zap, CheckCircle2,
} from 'lucide-react';
import ResumeInsightsPanel, { type ResumeInsightsData } from '@/components/onboarding/ResumeInsightsPanel';

// ─── Types ──────────────────────────────────────
interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface OnboardingData {
  fullName: string;
  phone: string;
  location: string;
  linkedin: string;
  targetRole: string;
  experienceLevel: string;
  currentStatus: string;
  experiences: ExperienceEntry[];
  educationLevel: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  skills: string[];
  bio: string;
}

// ─── Constants ──────────────────────────────────
const experienceLevels = [
  { value: 'fresher', label: 'Fresher / Student', desc: 'No work experience' },
  { value: '0-1', label: '0-1 Years', desc: 'Just starting out' },
  { value: '1-3', label: '1-3 Years', desc: 'Early career' },
  { value: '3-5', label: '3-5 Years', desc: 'Mid-level' },
  { value: '5-10', label: '5-10 Years', desc: 'Senior' },
  { value: '10+', label: '10+ Years', desc: 'Veteran' },
];


const suggestedRoles = [
  'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Cloud Architect',
  'Product Manager', 'UX Designer', 'Cybersecurity Analyst', 'Mobile Developer',
  'Business Analyst', 'Marketing Manager', 'Project Manager', 'QA Engineer',
];

// Approximate salary ranges (USD) per role
const roleSalaryMap: Record<string, { us: string; eu: string; global: string }> = {
  'Software Engineer': { us: '$90K - $180K', eu: '\u20AC60K - \u20AC120K', global: '$40K - $100K' },
  'Full Stack Developer': { us: '$85K - $170K', eu: '\u20AC55K - \u20AC110K', global: '$35K - $90K' },
  'Frontend Developer': { us: '$80K - $150K', eu: '\u20AC50K - \u20AC100K', global: '$30K - $80K' },
  'Backend Developer': { us: '$85K - $165K', eu: '\u20AC55K - \u20AC110K', global: '$35K - $90K' },
  'Data Scientist': { us: '$100K - $200K', eu: '\u20AC65K - \u20AC130K', global: '$45K - $110K' },
  'ML Engineer': { us: '$110K - $220K', eu: '\u20AC70K - \u20AC140K', global: '$50K - $120K' },
  'DevOps Engineer': { us: '$95K - $180K', eu: '\u20AC60K - \u20AC120K', global: '$40K - $100K' },
  'Cloud Architect': { us: '$120K - $220K', eu: '\u20AC75K - \u20AC150K', global: '$55K - $130K' },
  'Product Manager': { us: '$100K - $190K', eu: '\u20AC60K - \u20AC130K', global: '$40K - $100K' },
  'UX Designer': { us: '$75K - $150K', eu: '\u20AC45K - \u20AC95K', global: '$30K - $75K' },
  'Cybersecurity Analyst': { us: '$85K - $170K', eu: '\u20AC55K - \u20AC110K', global: '$35K - $90K' },
  'Mobile Developer': { us: '$85K - $165K', eu: '\u20AC55K - \u20AC110K', global: '$35K - $85K' },
  'Business Analyst': { us: '$70K - $130K', eu: '\u20AC45K - \u20AC90K', global: '$30K - $70K' },
  'Marketing Manager': { us: '$75K - $145K', eu: '\u20AC45K - \u20AC95K', global: '$25K - $70K' },
  'Project Manager': { us: '$80K - $155K', eu: '\u20AC50K - \u20AC100K', global: '$30K - $80K' },
  'QA Engineer': { us: '$70K - $140K', eu: '\u20AC45K - \u20AC90K', global: '$25K - $70K' },
};

const roleSkillMap: Record<string, string[]> = {
  'Software Engineer': ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS', 'System Design'],
  'Full Stack Developer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Git', 'Docker'],
  'Frontend Developer': ['JavaScript', 'TypeScript', 'React', 'Vue.js', 'CSS/SCSS', 'Tailwind CSS', 'HTML5', 'Figma', 'Responsive Design', 'Testing'],
  'Backend Developer': ['Python', 'Java', 'Node.js', 'Go', 'SQL', 'MongoDB', 'Redis', 'Docker', 'REST APIs', 'Microservices'],
  'Data Scientist': ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'Tableau', 'Statistics', 'Machine Learning'],
  'ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'Docker', 'AWS/GCP', 'Data Pipelines', 'NLP', 'Computer Vision', 'Deep Learning'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Ansible', 'Monitoring', 'Python', 'Bash'],
  'Product Manager': ['Product Strategy', 'User Research', 'Agile/Scrum', 'Data Analysis', 'Roadmapping', 'A/B Testing', 'SQL', 'Figma', 'JIRA', 'Stakeholder Management'],
  'UX Designer': ['Figma', 'User Research', 'Prototyping', 'Wireframing', 'Design Systems', 'Usability Testing', 'Adobe XD', 'CSS', 'Accessibility', 'Visual Design'],
  'Cybersecurity Analyst': ['Network Security', 'SIEM', 'Penetration Testing', 'Firewalls', 'Linux', 'Python', 'Vulnerability Assessment', 'Incident Response', 'Compliance', 'Encryption'],
  'Mobile Developer': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'REST APIs', 'Firebase', 'Git', 'UI/UX', 'App Store Deployment', 'Testing'],
  'Business Analyst': ['SQL', 'Excel', 'Power BI', 'Tableau', 'JIRA', 'Process Mapping', 'Requirements Gathering', 'Agile', 'Data Analysis', 'Stakeholder Management'],
};

const genericSkills = [
  'JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'React', 'Node.js', 'SQL',
  'Git', 'Docker', 'AWS', 'HTML/CSS', 'REST APIs', 'Agile', 'Communication',
  'Problem Solving', 'Leadership', 'Data Analysis', 'Machine Learning', 'Excel',
];

// Static salary data (numeric) for instant insights generation
const roleSalaryNumeric: Record<string, { low: number; median: number; high: number; growth: number }> = {
  'Software Engineer': { low: 78_000, median: 130_000, high: 200_000, growth: 25 },
  'Full Stack Developer': { low: 75_000, median: 125_000, high: 185_000, growth: 23 },
  'Frontend Developer': { low: 70_000, median: 115_000, high: 175_000, growth: 20 },
  'Backend Developer': { low: 80_000, median: 130_000, high: 195_000, growth: 22 },
  'Data Scientist': { low: 85_000, median: 108_000, high: 180_000, growth: 35 },
  'ML Engineer': { low: 95_000, median: 140_000, high: 230_000, growth: 40 },
  'DevOps Engineer': { low: 80_000, median: 125_000, high: 180_000, growth: 20 },
  'Cloud Architect': { low: 100_000, median: 150_000, high: 225_000, growth: 25 },
  'Product Manager': { low: 90_000, median: 130_000, high: 190_000, growth: 12 },
  'UX Designer': { low: 65_000, median: 100_000, high: 155_000, growth: 15 },
  'Cybersecurity Analyst': { low: 75_000, median: 110_000, high: 170_000, growth: 32 },
  'Mobile Developer': { low: 72_000, median: 118_000, high: 170_000, growth: 18 },
  'Business Analyst': { low: 60_000, median: 90_000, high: 135_000, growth: 10 },
  'Marketing Manager': { low: 60_000, median: 95_000, high: 150_000, growth: 8 },
  'Project Manager': { low: 70_000, median: 105_000, high: 160_000, growth: 6 },
  'QA Engineer': { low: 60_000, median: 90_000, high: 145_000, growth: 15 },
};

// Experience multipliers for salary adjustment
const expMultipliers: Record<string, number> = {
  fresher: 0.60, '0-1': 0.70, '1-3': 0.85, '3-5': 1.0, '5-10': 1.25, '10+': 1.50,
};

/**
 * Generate instant static insights from parsed resume data.
 * No API call needed — uses local data for immediate display.
 */
function generateStaticInsights(parsed: OnboardingData): ResumeInsightsData {
  const role = parsed.targetRole || 'Software Engineer';
  const salary = roleSalaryNumeric[role] || { low: 50_000, median: 80_000, high: 150_000, growth: 15 };
  const mult = expMultipliers[parsed.experienceLevel] || 1.0;

  const low = Math.round(salary.low * mult);
  const median = Math.round(salary.median * mult);
  const high = Math.round(salary.high * mult);
  const growth = salary.growth;

  // Determine demand based on growth rate
  const demandLevel: 'high' | 'medium' | 'low' = growth > 20 ? 'high' : growth > 10 ? 'medium' : 'low';
  const marketTrend: 'growing' | 'stable' | 'declining' = growth > 10 ? 'growing' : 'stable';

  // Generate matching roles based on skills
  const userSkills = parsed.skills || [];
  const matchingRoles = [role];
  if (userSkills.some(s => /react|vue|angular|frontend|css/i.test(s))) matchingRoles.push('Frontend Developer');
  if (userSkills.some(s => /node|python|java|backend|api/i.test(s))) matchingRoles.push('Backend Developer');
  if (userSkills.some(s => /data|sql|tableau|analytics/i.test(s))) matchingRoles.push('Data Analyst');
  if (userSkills.some(s => /cloud|aws|azure|gcp|docker|kubernetes/i.test(s))) matchingRoles.push('Cloud Engineer');
  if (userSkills.some(s => /machine learning|tensorflow|pytorch|ml/i.test(s))) matchingRoles.push('ML Engineer');
  // Deduplicate
  const uniqueRoles = [...new Set(matchingRoles)].slice(0, 5);

  // Determine skill gaps based on role requirements
  const requiredSkills = roleSkillMap[role] || genericSkills.slice(0, 8);
  const skillGaps = requiredSkills
    .filter(s => !userSkills.some(us => us.toLowerCase() === s.toLowerCase()))
    .slice(0, 3);

  const expLabel = parsed.experienceLevel === 'fresher' ? 'entry-level' :
    parsed.experienceLevel === '10+' ? 'veteran' :
    `${parsed.experienceLevel} years experience`;

  return {
    salary: { low, median, high, currency: 'USD', growthRate: growth },
    market: {
      demandLevel,
      marketTrend,
      topCompanies: [], // Will be filled by AI
      matchingRoles: uniqueRoles,
    },
    insights: {
      keyInsight: `${role} roles are in ${demandLevel} demand with ${growth}% projected growth. Your ${expLabel} profile positions you well in this market.`,
      resumeStrength: `Resume captured with ${userSkills.length} skills and ${parsed.experiences.length} experience entries.`,
      forgeRecommendation: `Agent Forge can tailor your resume with ATS-optimized keywords for ${role} positions, potentially increasing your interview callback rate by 40%.`,
      topSkillGaps: skillGaps,
      competitiveEdge: parsed.experiences.length > 0
        ? `Your experience at ${parsed.experiences[0].company || 'previous roles'} gives you practical expertise that employers value.`
        : `Your ${parsed.educationLevel || 'academic'} background in ${parsed.fieldOfStudy || 'your field'} provides a strong foundation.`,
    },
  };
}

const STEPS = [
  { icon: FileText, label: 'Resume' },
  { icon: Briefcase, label: 'Your Profile' },
  { icon: Sparkles, label: 'All Set' },
];

// ─── Component ──────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Resume upload state
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste' | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume insights state (shown instantly after parsing — no loading needed)
  const [insightsData, setInsightsData] = useState<ResumeInsightsData | null>(null);

  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    phone: '',
    location: '',
    linkedin: '',
    targetRole: '',
    experienceLevel: '',
    currentStatus: '',
    experiences: [],
    educationLevel: '',
    fieldOfStudy: '',
    institution: '',
    graduationYear: '',
    skills: [],
    bio: '',
  });

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((profile) => {
        if (profile.name) setData((prev) => ({ ...prev, fullName: profile.name }));
        if (profile.email) setUserEmail(profile.email);
      })
      .catch(() => {});
  }, []);

  const totalSteps = STEPS.length;
  const update = (fields: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...fields }));

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const toggleSkill = (skill: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !data.skills.includes(customSkill.trim())) {
      setData((prev) => ({ ...prev, skills: [...prev.skills, customSkill.trim()] }));
      setCustomSkill('');
    }
  };


  const suggestedSkills = roleSkillMap[data.targetRole] || genericSkills;
  const salaryInfo = roleSalaryMap[data.targetRole];

  // ─── Resume Parsing ───────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    const validExts = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const parseResume = async (mode: 'file' | 'text') => {
    setParsing(true);
    setError('');

    try {
      let res: Response;

      if (mode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await fetch('/api/resume/parse', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: resumeText }),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to parse resume');
      }

      // Auto-populate all fields from AI response
      const parsed = result.data;
      setData((prev) => ({
        ...prev,
        fullName: parsed.fullName || prev.fullName,
        phone: parsed.phone || prev.phone,
        location: parsed.location || prev.location,
        linkedin: parsed.linkedin || prev.linkedin,
        targetRole: parsed.targetRole || prev.targetRole,
        experienceLevel: parsed.experienceLevel || prev.experienceLevel,
        currentStatus: parsed.currentStatus || prev.currentStatus,
        experiences: parsed.experiences?.length ? parsed.experiences : prev.experiences,
        educationLevel: parsed.educationLevel || prev.educationLevel,
        fieldOfStudy: parsed.fieldOfStudy || prev.fieldOfStudy,
        institution: parsed.institution || prev.institution,
        graduationYear: parsed.graduationYear || prev.graduationYear,
        skills: parsed.skills?.length ? parsed.skills : prev.skills,
        bio: parsed.bio || prev.bio,
      }));

      setResumeParsed(true);

      // Save raw resume text to localStorage so agents can reference it
      if (mode === 'text' && resumeText) {
        localStorage.setItem('3box_resume_raw_text', resumeText);
      } else if (mode === 'file') {
        localStorage.setItem('3box_resume_raw_text', parsed.bio || '');
      }

      // ── Generate INSTANT static insights from parsed data (no API call) ──
      const parsedWithData: OnboardingData = {
        fullName: parsed.fullName || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        linkedin: parsed.linkedin || '',
        targetRole: parsed.targetRole || '',
        experienceLevel: parsed.experienceLevel || '',
        currentStatus: parsed.currentStatus || 'job-searching',
        experiences: parsed.experiences || [],
        educationLevel: parsed.educationLevel || '',
        fieldOfStudy: parsed.fieldOfStudy || '',
        institution: parsed.institution || '',
        graduationYear: parsed.graduationYear || '',
        skills: parsed.skills || [],
        bio: parsed.bio || '',
      };
      const staticInsights = generateStaticInsights(parsedWithData);
      setInsightsData(staticInsights);

      // ── Enhance with AI-powered insights in background (non-blocking) ──
      fetch('/api/ai/resume-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: parsed.targetRole || '',
          location: parsed.location || '',
          experienceLevel: parsed.experienceLevel || '',
          skills: parsed.skills || [],
          experiences: parsed.experiences || [],
          educationLevel: parsed.educationLevel || '',
          currentStatus: parsed.currentStatus || 'job-searching',
        }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.success && result.data) {
            // Merge AI data with static — AI data takes priority
            setInsightsData(result.data);
          }
        })
        .catch(() => {
          // Static insights already showing — no action needed
        });

      // Don't auto-advance — let user see insights first
      // They'll click "Continue" on the insights panel
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume. Please try again or fill in manually.');
    } finally {
      setParsing(false);
    }
  };

  // ─── Step Validation ──────────────────────────
  const canProceed = (s: number): boolean => {
    switch (s) {
      case 0: return true; // Resume step is always skippable
      case 1: return !!data.targetRole.trim() && !!data.location.trim() && !!data.experienceLevel;
      case 2: return true; // Confirmation step
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Retrieve raw resume text from localStorage if available
      const savedResumeText = typeof window !== 'undefined' ? localStorage.getItem('3box_resume_raw_text') || '' : '';

      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: data.targetRole,
          interests: data.skills.slice(0, 5),
          resumeText: savedResumeText,
          profile: {
            fullName: data.fullName,
            phone: data.phone,
            location: data.location,
            linkedin: data.linkedin,
            experienceLevel: data.experienceLevel,
            currentStatus: data.currentStatus,
            experiences: data.experiences,
            educationLevel: data.educationLevel,
            fieldOfStudy: data.fieldOfStudy,
            institution: data.institution,
            graduationYear: data.graduationYear,
            skills: data.skills,
            bio: data.bio,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      // Save to localStorage for resume builder and dashboard
      localStorage.setItem('3box_target_role', data.targetRole);
      localStorage.setItem('3box_interests', JSON.stringify(data.skills.slice(0, 5)));
      localStorage.setItem('3box_onboarding_profile', JSON.stringify(data));
      localStorage.setItem('3box_user_location', data.location);
      localStorage.setItem('3box_skill_scores', JSON.stringify(
        data.skills.reduce((acc, skill) => {
          acc[skill] = data.experienceLevel === 'fresher' ? 30 : data.experienceLevel === '0-1' ? 40 : data.experienceLevel === '1-3' ? 55 : data.experienceLevel === '3-5' ? 65 : data.experienceLevel === '5-10' ? 75 : 85;
          return acc;
        }, {} as Record<string, number>)
      ));

      // Save resume draft from onboarding data
      const resumeData = {
        personalInfo: { fullName: data.fullName, email: userEmail, phone: data.phone, location: data.location, linkedin: data.linkedin },
        summary: data.bio || `${data.experienceLevel === 'fresher' ? 'Aspiring' : 'Experienced'} ${data.targetRole} with a background in ${data.fieldOfStudy || 'technology'}. Passionate about ${data.skills.slice(0, 3).join(', ')}.`,
        experience: data.experiences,
        education: { level: data.educationLevel, field: data.fieldOfStudy, institution: data.institution, year: data.graduationYear },
        skills: data.skills,
        targetRole: data.targetRole,
      };
      localStorage.setItem('3box_resume_draft', JSON.stringify(resumeData));

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  // Count how many fields were auto-filled
  const filledCount = [data.fullName, data.location, data.targetRole, data.experienceLevel, data.educationLevel, data.skills.length >= 2 ? 'yes' : ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface bg-grid flex items-center justify-center p-4 relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-radial from-neon-blue/5 via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-radial from-neon-purple/5 via-transparent to-transparent rounded-full blur-3xl" />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">Welcome to <span className="gradient-text">3BOX AI</span></h1>
          <p className="text-white/40 text-sm">
            {step === 0
              ? 'Upload your resume to auto-fill everything, or skip to fill manually'
              : 'Tell us about yourself so we can personalize your experience'}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.button
                  onClick={() => { if (i < step) { setDirection(-1); setStep(i); } }}
                  animate={{ scale: step === i ? 1.15 : 1, boxShadow: step === i ? '0 0 20px rgba(0,212,255,0.3)' : 'none' }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    step > i ? 'bg-neon-green/20 border-2 border-neon-green cursor-pointer' : step === i ? 'bg-neon-blue/20 border-2 border-neon-blue' : 'bg-white/5 border-2 border-white/10'
                  }`}
                >
                  {step > i ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <s.icon className={`w-3.5 h-3.5 ${step === i ? 'text-neon-blue' : 'text-white/30'}`} />}
                </motion.button>
                <span className={`text-[9px] mt-1 font-medium ${step >= i ? 'text-white/60' : 'text-white/20'}`}>{s.label}</span>
              </div>
              {i < totalSteps - 1 && (
                <div className="flex-1 h-px mx-1.5 mb-5">
                  <div className="h-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full" animate={{ width: step > i ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass p-6 sm:p-8 min-h-[480px] relative overflow-hidden">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</motion.div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            {/* ─── Step 0: Resume Upload ────────── */}
            {step === 0 && (
              <motion.div key="step-0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-cyan-400 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Quick Start with Resume</h2>
                    <p className="text-xs text-white/40">AI will extract all your details automatically</p>
                  </div>
                </div>

                {/* Success state: Resume parsed → show career market insights */}
                {resumeParsed && insightsData && (
                  <div>
                    {/* Quick confirmation bar */}
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-neon-green/5 border border-neon-green/10"
                    >
                      <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                      <span className="text-xs text-neon-green font-medium">Resume parsed — {filledCount} fields extracted</span>
                      <div className="flex flex-wrap gap-1 ml-auto">
                        {data.skills.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[9px]">{data.skills.length} Skills</span>}
                        {data.experiences.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[9px]">{data.experiences.length} Exp</span>}
                      </div>
                    </motion.div>

                    {/* Career Market Insights Panel — shows instantly with static data,
                        then auto-enhances with AI-powered data in background */}
                    <ResumeInsightsPanel
                      data={insightsData}
                      targetRole={data.targetRole}
                      location={data.location}
                      onContinue={goNext}
                    />
                  </div>
                )}

                {/* Parsing state */}
                {parsing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 rounded-2xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-neon-blue/10 text-center"
                  >
                    <Loader2 className="w-10 h-10 text-neon-blue mx-auto mb-3 animate-spin" />
                    <h3 className="text-base font-bold text-white mb-1">AI is reading your resume...</h3>
                    <p className="text-xs text-white/40">Extracting name, skills, experience, education, and more</p>
                  </motion.div>
                )}

                {/* Mode selection or input */}
                {!parsing && !resumeParsed && (
                  <div className="space-y-4">
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
                          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                            dragOver
                              ? 'border-neon-blue bg-neon-blue/5'
                              : selectedFile
                                ? 'border-neon-green/30 bg-neon-green/5'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                          }`}
                        >
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-3">
                              <FileText className="w-8 h-8 text-neon-green" />
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
                              <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-neon-blue' : 'text-white/20'}`} />
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
                            className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
                          >
                            <Zap className="w-4 h-4" /> Parse Resume with AI
                          </button>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    {resumeMode !== 'paste' && resumeMode !== 'upload' && (
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
                            className="w-full p-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/70"
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
                              className="input-field resize-none text-xs"
                              rows={8}
                              placeholder="Paste your entire resume text here..."
                              autoFocus
                            />
                            <button
                              onClick={() => parseResume('text')}
                              disabled={resumeText.trim().length < 30}
                              className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
                            >
                              <Zap className="w-4 h-4" /> Parse Resume with AI
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Skip button — hidden when insights panel is showing (it has its own CTA) */}
                {!(resumeParsed && insightsData) && (
                  <button
                    onClick={goNext}
                    className="w-full mt-4 py-2.5 text-xs text-white/30 hover:text-white/50 transition-colors text-center"
                  >
                    {resumeParsed ? 'Continue to review details \u2192' : 'Skip \u2014 I\u2019ll fill in manually'}
                  </button>
                )}
              </motion.div>
            )}

            {/* ─── Step 1: Your Profile (Target Role + Location + Experience) ────────── */}
            {step === 1 && (
              <motion.div key="step-1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-pink-400 flex items-center justify-center"><Briefcase className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Your Profile</h2>
                    <p className="text-xs text-white/40">
                      {resumeParsed ? 'Review the auto-filled details below' : 'Tell us about yourself and your career goals'}
                    </p>
                  </div>
                  {resumeParsed && data.targetRole && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px] font-medium">Auto-filled</span>}
                </div>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {/* Name & Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} className="input-field pl-10" placeholder="John Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Location *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input value={data.location} onChange={(e) => update({ location: e.target.value })} className="input-field pl-10" placeholder="City, Country" />
                      </div>
                    </div>
                  </div>

                  {/* Target Role */}
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Target Role *</label>
                    <input value={data.targetRole} onChange={(e) => update({ targetRole: e.target.value })} className="input-field mb-2" placeholder="e.g. Software Engineer" />
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedRoles.slice(0, 8).map((role) => (
                        <button key={role} onClick={() => update({ targetRole: role })}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${data.targetRole === role ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'}`}>{role}</button>
                      ))}
                    </div>
                  </div>

                  {/* Salary Preview */}
                  {salaryInfo && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-xl bg-gradient-to-r from-neon-green/5 to-emerald-500/5 border border-neon-green/10">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-neon-green" />
                        <span className="text-xs font-semibold text-neon-green">Salary Range for {data.targetRole}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px] text-white/30 mb-0.5">US</div>
                          <div className="text-xs font-bold text-white/80">{salaryInfo.us}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/30 mb-0.5">Europe</div>
                          <div className="text-xs font-bold text-white/80">{salaryInfo.eu}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/30 mb-0.5">Global Avg</div>
                          <div className="text-xs font-bold text-white/80">{salaryInfo.global}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Experience Level */}
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Experience Level *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {experienceLevels.map((lvl) => (
                        <button key={lvl.value} onClick={() => update({ experienceLevel: lvl.value })}
                          className={`p-2.5 rounded-xl text-left transition-all ${data.experienceLevel === lvl.value ? 'bg-neon-purple/10 border border-neon-purple/40' : 'bg-white/[0.03] border border-white/5 hover:bg-white/5'}`}>
                          <div className="text-xs font-semibold">{lvl.label}</div>
                          <div className="text-[10px] text-white/30">{lvl.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skills (inline, compact) */}
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">{data.targetRole ? `Skills for ${data.targetRole}` : 'Skills'} <span className="text-white/30">(optional)</span></label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.slice(0, 10).map((skill) => {
                        const isSelected = data.skills.includes(skill);
                        return (
                          <button key={skill} onClick={() => toggleSkill(skill)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${isSelected ? 'bg-neon-green/15 border border-neon-green/40 text-neon-green' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'}`}>
                            {isSelected && <Check className="w-3 h-3 inline mr-0.5 -mt-0.5" />}{skill}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                        className="input-field flex-1 text-xs" placeholder="Add a custom skill" />
                      <button onClick={addCustomSkill} disabled={!customSkill.trim()} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
                    </div>
                    {data.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {data.skills.filter(s => !suggestedSkills.slice(0, 10).includes(s)).map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neon-blue/10 border border-neon-blue/30 text-neon-blue">
                            {skill}
                            <button onClick={() => toggleSkill(skill)} className="hover:text-white"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={goNext} disabled={!canProceed(1)} className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: You're All Set ────────── */}
            {step === 2 && (
              <motion.div key="step-2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center mx-auto mb-5"
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold mb-2">You&apos;re All Set!</h2>
                  <p className="text-sm text-white/40 max-w-md mx-auto mb-6">
                    Your profile is ready. Our AI agents will personalize your experience based on your goals.
                  </p>

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-left space-y-2 mb-6 max-w-sm mx-auto">
                    {data.fullName && (
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-white/60">{data.fullName}</span>
                      </div>
                    )}
                    {data.targetRole && (
                      <div className="flex items-center gap-2 text-xs">
                        <Briefcase className="w-3.5 h-3.5 text-neon-blue" />
                        <span className="text-white/80 font-medium">{data.targetRole}</span>
                      </div>
                    )}
                    {data.location && (
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-white/60">{data.location}</span>
                      </div>
                    )}
                    {data.experienceLevel && (
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                        <span className="text-white/60">{experienceLevels.find(l => l.value === data.experienceLevel)?.label || data.experienceLevel}</span>
                      </div>
                    )}
                    {data.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {data.skills.slice(0, 6).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded-full text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/20">{skill}</span>
                        ))}
                        {data.skills.length > 6 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/30">+{data.skills.length - 6} more</span>}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-white/30 mb-4">You can update these details anytime in Settings.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-base py-3">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Rocket className="w-5 h-5" /> Launch My Career</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-4 text-[11px] text-white/20">Your data is secure and used only to personalize your AI experience</div>
      </div>
    </div>
  );
}
