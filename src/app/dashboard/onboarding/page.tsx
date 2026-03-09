'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Sparkles, ArrowRight, ArrowLeft,
  Check, MapPin, Phone, Linkedin, Plus, X, Loader2, Rocket,
  DollarSign, FileText, Upload, ClipboardPaste, Zap, CheckCircle2,
} from 'lucide-react';

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

const currentStatuses = [
  { value: 'student', label: 'Student' },
  { value: 'employed', label: 'Currently Employed' },
  { value: 'job-searching', label: 'Looking for a Job' },
  { value: 'career-change', label: 'Changing Careers' },
  { value: 'freelancer', label: 'Freelancer' },
];

const educationLevels = [
  'High School', "Associate's Degree", "Bachelor's Degree", "Master's Degree", 'PhD / Doctorate', 'Self-Taught', 'Bootcamp',
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

const STEPS = [
  { icon: FileText, label: 'Resume' },
  { icon: User, label: 'About You' },
  { icon: Briefcase, label: 'Career' },
  { icon: GraduationCap, label: 'Background' },
  { icon: Sparkles, label: 'Skills' },
  { icon: Sparkles, label: 'Agents' },
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

  const addExperience = () => {
    setData((prev) => ({ ...prev, experiences: [...prev.experiences, { title: '', company: '', duration: '', description: '' }] }));
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    setData((prev) => {
      const updated = [...prev.experiences];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experiences: updated };
    });
  };

  const removeExperience = (index: number) => {
    setData((prev) => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== index) }));
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

      // Auto-advance to next step after short delay
      setTimeout(() => {
        setDirection(1);
        setStep(1);
      }, 1500);
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
      case 1: return !!data.fullName.trim() && !!data.location.trim();
      case 2: return !!data.targetRole.trim() && !!data.experienceLevel && !!data.currentStatus;
      case 3: return !!data.educationLevel;
      case 4: return data.skills.length >= 2;
      case 5: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: data.targetRole,
          interests: data.skills.slice(0, 5),
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
    <div className="min-h-screen bg-surface bg-grid flex items-center justify-center p-4 relative overflow-hidden">
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

                {/* Success state */}
                {resumeParsed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-neon-green/10 to-emerald-500/5 border border-neon-green/20 text-center"
                  >
                    <CheckCircle2 className="w-12 h-12 text-neon-green mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Resume Parsed Successfully!</h3>
                    <p className="text-xs text-white/50 mb-3">
                      {filledCount} fields auto-filled. Review and edit in the next steps.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {data.fullName && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">Name</span>}
                      {data.location && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">Location</span>}
                      {data.targetRole && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">Target Role</span>}
                      {data.experienceLevel && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">Experience</span>}
                      {data.educationLevel && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">Education</span>}
                      {data.skills.length > 0 && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">{data.skills.length} Skills</span>}
                      {data.experiences.length > 0 && <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px]">{data.experiences.length} Experiences</span>}
                    </div>
                  </motion.div>
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

                {/* Skip button */}
                <button
                  onClick={goNext}
                  className="w-full mt-4 py-2.5 text-xs text-white/30 hover:text-white/50 transition-colors text-center"
                >
                  {resumeParsed ? 'Continue to review details \u2192' : 'Skip \u2014 I\u2019ll fill in manually'}
                </button>
              </motion.div>
            )}

            {/* ─── Step 1: About You ────────── */}
            {step === 1 && (
              <motion.div key="step-1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-cyan-400 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold">About You</h2>
                    <p className="text-xs text-white/40">
                      {resumeParsed ? 'Review the auto-filled details below' : 'Basic information for your profile'}
                    </p>
                  </div>
                  {resumeParsed && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px] font-medium">Auto-filled</span>}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} className="input-field pl-10" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input value={data.phone} onChange={(e) => update({ phone: e.target.value })} className="input-field pl-10" placeholder="+1 (555) 000-0000" />
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
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">LinkedIn URL</label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input value={data.linkedin} onChange={(e) => update({ linkedin: e.target.value })} className="input-field pl-10" placeholder="linkedin.com/in/yourprofile" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Brief Bio</label>
                    <textarea value={data.bio} onChange={(e) => update({ bio: e.target.value })} className="input-field resize-none" rows={2} placeholder="A sentence about yourself (optional — AI generates this for you)" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={goNext} disabled={!canProceed(1)} className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Career ──────────── */}
            {step === 2 && (
              <motion.div key="step-2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-pink-400 flex items-center justify-center"><Briefcase className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Career Goals</h2>
                    <p className="text-xs text-white/40">Where are you heading?</p>
                  </div>
                  {resumeParsed && data.targetRole && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px] font-medium">Auto-filled</span>}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">What role are you targeting? *</label>
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

                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Current Status *</label>
                    <div className="flex flex-wrap gap-2">
                      {currentStatuses.map((s) => (
                        <button key={s.value} onClick={() => update({ currentStatus: s.value })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${data.currentStatus === s.value ? 'bg-neon-green/15 border border-neon-green/40 text-neon-green' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'}`}>{s.label}</button>
                      ))}
                    </div>
                  </div>

                  {(data.currentStatus === 'employed' || data.currentStatus === 'career-change' || data.currentStatus === 'freelancer') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-white/50">Work Experience</label>
                        <button onClick={addExperience} className="text-[11px] text-neon-blue hover:text-neon-blue/80 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                      </div>
                      {data.experiences.length === 0 && (
                        <button onClick={addExperience} className="w-full p-3 rounded-xl border border-dashed border-white/10 text-xs text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
                          + Add your most recent work experience
                        </button>
                      )}
                      {data.experiences.map((exp, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-2 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/30">Experience {i + 1}</span>
                            <button onClick={() => removeExperience(i)} className="text-white/20 hover:text-red-400"><X className="w-3 h-3" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} className="input-field text-xs py-1.5" placeholder="Job Title" />
                            <input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} className="input-field text-xs py-1.5" placeholder="Company" />
                          </div>
                          <input value={exp.duration} onChange={(e) => updateExperience(i, 'duration', e.target.value)} className="input-field text-xs py-1.5" placeholder="Duration (e.g. Jan 2022 - Present)" />
                          <textarea value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} className="input-field text-xs py-1.5 resize-none" rows={2} placeholder="Key achievements (optional)" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={goNext} disabled={!canProceed(2)} className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Education ────────── */}
            {step === 3 && (
              <motion.div key="step-3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Education</h2>
                    <p className="text-xs text-white/40">Your academic background</p>
                  </div>
                  {resumeParsed && data.educationLevel && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px] font-medium">Auto-filled</span>}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Highest Education *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {educationLevels.map((lvl) => (
                        <button key={lvl} onClick={() => update({ educationLevel: lvl })}
                          className={`p-2.5 rounded-xl text-xs font-medium text-left transition-all ${data.educationLevel === lvl ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400' : 'bg-white/[0.03] border border-white/5 text-white/50 hover:bg-white/5'}`}>{lvl}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Field of Study</label>
                      <input value={data.fieldOfStudy} onChange={(e) => update({ fieldOfStudy: e.target.value })} className="input-field" placeholder="e.g. Computer Science" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Graduation Year</label>
                      <input value={data.graduationYear} onChange={(e) => update({ graduationYear: e.target.value })} className="input-field" placeholder="e.g. 2024" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Institution</label>
                    <input value={data.institution} onChange={(e) => update({ institution: e.target.value })} className="input-field" placeholder="University or school name" />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={goNext} disabled={!canProceed(3)} className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 4: Skills ──────────── */}
            {step === 4 && (
              <motion.div key="step-4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Your Skills</h2>
                    <p className="text-xs text-white/40">Select at least 2 skills (powers your AI recommendations)</p>
                  </div>
                  {resumeParsed && data.skills.length > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px] font-medium">{data.skills.length} from resume</span>}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">{data.targetRole ? `Recommended for ${data.targetRole}` : 'Popular Skills'}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.map((skill) => {
                        const isSelected = data.skills.includes(skill);
                        return (
                          <button key={skill} onClick={() => toggleSkill(skill)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${isSelected ? 'bg-neon-green/15 border border-neon-green/40 text-neon-green' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'}`}>
                            {isSelected && <Check className="w-3 h-3 inline mr-0.5 -mt-0.5" />}{skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Add your own</label>
                    <div className="flex gap-2">
                      <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                        className="input-field flex-1" placeholder="Type a skill and press Enter" />
                      <button onClick={addCustomSkill} disabled={!customSkill.trim()} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {data.skills.length > 0 && (
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Selected ({data.skills.length})</label>
                      <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neon-blue/10 border border-neon-blue/30 text-neon-blue">
                            {skill}
                            <button onClick={() => toggleSkill(skill)} className="hover:text-white"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={goNext} disabled={!canProceed(4)} className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 5: Meet Your Agents ──── */}
            {step === 5 && (
              <motion.div key="step-5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-5">
                  <h2 className="text-xl font-bold">Meet Your AI Agents</h2>
                  <p className="text-xs text-white/40 mt-1 max-w-md mx-auto">Your personal team of AI agents will work together to accelerate your career. Here&apos;s your team:</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { emoji: '\uD83D\uDD0D', name: 'Scout', role: 'Job Hunter', desc: 'Finds jobs matching your profile', borderColor: 'border-l-blue-500' },
                    { emoji: '\uD83D\uDCC4', name: 'Forge', role: 'Resume Optimizer', desc: 'Optimizes your resume per job', borderColor: 'border-l-orange-500' },
                    { emoji: '\uD83D\uDCE8', name: 'Archer', role: 'Application Agent', desc: 'Sends applications & cover letters', borderColor: 'border-l-green-500' },
                    { emoji: '\uD83C\uDFAF', name: 'Atlas', role: 'Interview Coach', desc: 'Preps company-specific interviews', borderColor: 'border-l-purple-500' },
                    { emoji: '\uD83D\uDCDA', name: 'Sage', role: 'Skill Trainer', desc: 'Identifies gaps & recommends learning', borderColor: 'border-l-teal-500' },
                    { emoji: '\uD83D\uDEE1\uFE0F', name: 'Sentinel', role: 'Quality Reviewer', desc: 'Reviews apps before sending', borderColor: 'border-l-rose-500' },
                  ].map((agent) => (
                    <div key={agent.name} className={`p-3 rounded-xl bg-white/[0.03] border border-white/5 border-l-[3px] ${agent.borderColor} transition-all hover:bg-white/[0.06]`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{agent.emoji}</span>
                        <span className="text-sm font-bold text-white">{agent.name}</span>
                        <span className="text-[10px] text-white/30 font-medium">{agent.role}</span>
                      </div>
                      <p className="text-[11px] text-white/40 pl-7">{agent.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-white/5 text-center">
                  <p className="text-[11px] text-white/40">Agents are coordinated by <span className="text-neon-blue font-semibold">Cortex</span>, your AI brain. Available agents scale with your plan.</p>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={goBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={handleSubmit} disabled={!canProceed(5) || loading}
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
