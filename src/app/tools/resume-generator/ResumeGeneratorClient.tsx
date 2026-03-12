'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import CopyButton from '@/components/tools/CopyButton';
import ResumeInput from '@/components/tools/ResumeInput';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

interface ResumeResult {
  summary: string;
  experience: ExperienceEntry[];
  skills: {
    technical: string[];
    soft: string[];
  };
  education: EducationEntry[];
  certifications: string[];
}

const experienceOptions = ['0-1', '1-3', '3-5', '5-10', '10+'];

export default function ResumeGeneratorClient() {
  const agent = getAgentForTool('resume-generator');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('1-3');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<ResumeResult>({
      serviceKey: 'resume_generator',
      apiEndpoint: '/api/tools/resume-generator',
    });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() && (!fullName.trim() || !currentRole.trim() || !targetRole.trim() || !skills.trim())) return;

    handleSubmit({
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      currentRole: currentRole.trim(),
      targetRole: targetRole.trim(),
      yearsExperience,
      skills: skills.trim(),
      experience: experience.trim() || undefined,
      education: education.trim() || undefined,
      resumeText,
    });
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40';
  const labelClass = 'block text-xs text-white/40 mb-1.5 font-medium';

  const form = { fullName, email, phone };

  return (
    <ToolPageLayout
      title="AI Resume Generator"
      subtitle="Generate a complete, ATS-optimized resume tailored to your target role"
      icon={FileText}
      iconColor="text-neon-green"
      gradient="from-neon-green/20 to-neon-purple/20"
      glowColor="from-neon-green/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="AI Resume Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="resume-generator"
    >
      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {results && (
        <div className="space-y-6 mb-6">
          {/* Header */}
          <div className="card text-center">
            <h2 className="text-xl font-bold">{form.fullName}</h2>
            <p className="text-sm text-white/50 mt-1">
              {[form.email, form.phone].filter(Boolean).join(' \u2022 ')}
            </p>
          </div>

          {/* Summary */}
          {results.summary && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Professional Summary</h3>
                <CopyButton text={results.summary} />
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{results.summary}</p>
            </div>
          )}

          {/* Experience */}
          {results.experience?.length > 0 && (
            <div className="card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Experience</h3>
              {results.experience.map((exp, i) => (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-white/5' : ''}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm">{exp.title}</p>
                      <p className="text-xs text-white/50">{exp.company}</p>
                    </div>
                    <span className="text-xs text-white/40">{exp.duration}</span>
                  </div>
                  <ul className="space-y-1">
                    {exp.bullets?.map((b, j) => (
                      <li key={j} className="text-xs text-white/60 flex gap-2">
                        <span className="text-neon-blue mt-0.5">&bull;</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {results.skills && (
            <div className="card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Skills</h3>
              {results.skills.technical?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-white/40 mb-2">Technical</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.skills.technical.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-neon-blue/10 text-neon-blue text-xs border border-neon-blue/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {results.skills.soft?.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2">Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.skills.soft.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-neon-green/10 text-neon-green text-xs border border-neon-green/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {results.education?.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Education</h3>
              {results.education.map((edu, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-white/80">{edu.degree}</p>
                    <p className="text-xs text-white/50">{edu.institution}</p>
                  </div>
                  <span className="text-xs text-white/40">{edu.year}</span>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {results.certifications?.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Certifications</h3>
              <ul className="space-y-1">
                {results.certifications.map((cert, i) => (
                  <li key={i} className="text-sm text-white/70">{cert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Copy All button */}
          <div className="flex justify-center">
            <CopyButton
              text={`${form.fullName}\n${[form.email, form.phone].filter(Boolean).join(' | ')}\n\nPROFESSIONAL SUMMARY\n${results.summary}\n\nEXPERIENCE\n${results.experience?.map(e => `${e.title} - ${e.company} (${e.duration})\n${e.bullets?.map(b => `\u2022 ${b}`).join('\n')}`).join('\n\n')}\n\nSKILLS\n${[...(results.skills?.technical || []), ...(results.skills?.soft || [])].join(', ')}\n\nEDUCATION\n${results.education?.map(e => `${e.degree} - ${e.institution} (${e.year})`).join('\n')}${results.certifications?.length ? `\n\nCERTIFICATIONS\n${results.certifications.join('\n')}` : ''}`}
              label="Copy Full Resume"
            />
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-4">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Full Name */}
        <div>
          <label className={labelClass}>Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., John Doe"
            className={inputClass}
            required
          />
        </div>

        {/* Email & Phone row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={inputClass}
            />
          </div>
        </div>

        {/* Current Role */}
        <div>
          <label className={labelClass}>Current/Most Recent Job Title *</label>
          <input
            type="text"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            placeholder="e.g., Frontend Developer"
            className={inputClass}
            required
          />
        </div>

        {/* Target Role */}
        <div>
          <label className={labelClass}>Target Role *</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Senior Full-Stack Engineer"
            className={inputClass}
            required
          />
        </div>

        {/* Years of Experience */}
        <div>
          <label className={labelClass}>Years of Experience *</label>
          <select
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className={inputClass}
          >
            {experienceOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-surface">
                {opt} years
              </option>
            ))}
          </select>
        </div>

        {/* Skills */}
        <div>
          <label className={labelClass}>Key Skills (comma-separated) *</label>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, Node.js, Python, Project Management..."
            rows={2}
            className={`${inputClass} resize-none`}
            required
          />
        </div>

        {/* Work Experience Summary */}
        <div>
          <label className={labelClass}>Work Experience Summary</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Brief description of your work experience, key achievements..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Education */}
        <div>
          <label className={labelClass}>Education</label>
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g., BS Computer Science, MIT 2020"
            className={inputClass}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && (!fullName.trim() || !currentRole.trim() || !targetRole.trim() || !skills.trim()))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Agent Forge is generating your resume...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Resume
            </>
          )}
        </button>
      </form>
    </ToolPageLayout>
  );
}
