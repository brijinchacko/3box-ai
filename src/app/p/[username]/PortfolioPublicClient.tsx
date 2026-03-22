'use client';

import { motion } from 'framer-motion';
import {
  ExternalLink,
  Github,
  Code,
  Sparkles,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Linkedin,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import PersonalizedStory from '@/components/dashboard/PersonalizedStory';

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  image: string | null;
  github: string;
  live: string;
  status: string;
  score: number | null;
}

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface PortfolioData {
  id: string;
  title: string;
  bio: string | null;
  projects: Project[];
  skills: string[];
  theme: string;
  slug: string;
}

interface UserData {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface ResumeData {
  experience: WorkExperience[];
  education: Education[];
  contact: {
    linkedin: string | null;
    portfolio: string | null;
    phone: string | null;
  } | null;
}

interface PortfolioPublicClientProps {
  portfolio: PortfolioData;
  user: UserData;
  story?: string | null;
  targetRole?: string | null;
  resumeData?: ResumeData | null;
}

// Helper: ensure URLs have protocol prefix
function ensureUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

// Format date string like "2023-01" or "Jan 2023" to a readable format
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handle "Present" or "current"
  if (dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'current') return 'Present';
  // Try to parse YYYY-MM or YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${parts[0]}`;
    }
  }
  return dateStr;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function PortfolioPublicClient({
  portfolio,
  user,
  story,
  targetRole,
  resumeData,
}: PortfolioPublicClientProps) {
  const experience = resumeData?.experience || [];
  const education = resumeData?.education || [];
  const linkedinUrl = resumeData?.contact?.linkedin || null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#a855f7]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00d4ff]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Header / User Info ── */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          {/* Avatar */}
          {user.image && (
            <motion.div
              className="mx-auto mb-6 relative w-fit"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/10 mx-auto ring-4 ring-[#a855f7]/20">
                <Image
                  src={user.image}
                  alt={user.name || 'User avatar'}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 right-0 w-8 h-8 bg-[#00ff88] rounded-full flex items-center justify-center border-4 border-[#0a0a0f]">
                <Sparkles className="w-3.5 h-3.5 text-[#0a0a0f]" />
              </div>
            </motion.div>
          )}

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-[#00d4ff] via-[#a855f7] to-[#00ff88] bg-clip-text text-transparent">
            {user.name || 'Portfolio'}
          </h1>

          {/* Target Role (replaces old "X's Portfolio" subtitle) */}
          {targetRole ? (
            <p className="text-lg sm:text-xl text-white/60 mb-4">{targetRole}</p>
          ) : portfolio.bio ? null : (
            <p className="text-lg sm:text-xl text-white/60 mb-4">{portfolio.title}</p>
          )}

          {/* Bio */}
          {portfolio.bio && (
            <p className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-5">
              {portfolio.bio}
            </p>
          )}

          {/* Social Links */}
          {(linkedinUrl || user.email) && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {linkedinUrl && (
                <a
                  href={ensureUrl(linkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-white/[0.05] border border-white/[0.08] text-white/60 hover:border-[#0077b5]/40 hover:text-[#0077b5] transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-white/[0.05] border border-white/[0.08] text-white/60 hover:border-[#00d4ff]/40 hover:text-[#00d4ff] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Story Section ── */}
        {story && (
          <motion.div variants={itemVariants} className="mb-16">
            <PersonalizedStory
              userName={user.name || undefined}
              userImage={user.image}
              story={story}
              readOnly
            />
          </motion.div>
        )}

        {/* ── Experience Section ── */}
        {experience.length > 0 && (
          <motion.div variants={itemVariants} className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-5 h-5 text-[#00d4ff]" />
              <h2 className="text-lg font-semibold text-white/80">Experience</h2>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.08]" />

              <div className="space-y-8">
                {experience.map((exp, i) => (
                  <motion.div
                    key={exp.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                    className="relative pl-8"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-[#a855f7]/60 bg-[#0a0a0f] z-10" />

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-white/[0.12] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                        <div>
                          <h3 className="font-semibold text-base text-white/90">{exp.role}</h3>
                          <p className="text-sm text-[#a855f7]/80">{exp.company}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/40 shrink-0">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(exp.startDate)} &ndash; {exp.current ? 'Present' : formatDate(exp.endDate)}
                          </span>
                          {exp.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {exp.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {exp.bullets.map((bullet, bi) => (
                            <li key={bi} className="text-sm text-white/40 leading-relaxed flex gap-2">
                              <span className="text-[#00d4ff]/50 mt-1.5 shrink-0">&#8226;</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Education Section ── */}
        {education.length > 0 && (
          <motion.div variants={itemVariants} className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-5 h-5 text-[#00ff88]" />
              <h2 className="text-lg font-semibold text-white/80">Education</h2>
            </div>
            <div className="space-y-4">
              {education.map((edu, i) => (
                <motion.div
                  key={edu.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div>
                      <h3 className="font-semibold text-base text-white/90">
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      </h3>
                      <p className="text-sm text-[#00ff88]/70">{edu.institution}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 shrink-0">
                      {(edu.startDate || edu.endDate) && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(edu.startDate)}{edu.endDate ? ` \u2013 ${formatDate(edu.endDate)}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {edu.gpa && (
                    <p className="text-xs text-white/30 mt-2">GPA: {edu.gpa}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Skills Section ── */}
        {portfolio.skills && portfolio.skills.length > 0 && (
          <motion.div variants={itemVariants} className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Code className="w-5 h-5 text-[#00d4ff]" />
              <h2 className="text-lg font-semibold text-white/80">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolio.skills.map((skill, i) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.03, duration: 0.3 }}
                  className="px-3 py-1.5 rounded-full text-sm bg-white/[0.04] border border-white/[0.08] text-white/60 hover:border-[#00d4ff]/30 hover:text-[#00d4ff] transition-colors"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Projects Section ── */}
        {portfolio.projects && portfolio.projects.length > 0 && (
          <motion.div variants={itemVariants} className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <FolderGit2 className="w-5 h-5 text-[#a855f7]" />
              <h2 className="text-lg font-semibold text-white/80">Projects</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {portfolio.projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 sm:p-6 hover:border-[#a855f7]/20 hover:bg-white/[0.05] transition-all duration-300 backdrop-blur-sm"
                >
                  {/* Project Title */}
                  <h3 className="font-semibold text-base sm:text-lg mb-2 group-hover:text-[#00d4ff] transition-colors">
                    {project.title}
                  </h3>

                  {/* Project Description */}
                  <p className="text-sm text-white/40 mb-4 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech Stack Tags */}
                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.skills.map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7]/70 border border-[#a855f7]/10"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-3">
                    {project.github && (
                      <a
                        href={ensureUrl(project.github)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                    {project.live && (
                      <a
                        href={ensureUrl(project.live)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#00d4ff] hover:underline flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Footer ── */}
        <motion.footer
          variants={itemVariants}
          className="mt-20 pt-8 border-t border-white/[0.06] text-center"
        >
          <p className="text-xs text-white/20">
            Built with{' '}
            <Link
              href="/"
              className="text-[#00d4ff]/50 hover:text-[#00d4ff] transition-colors"
            >
              3BOX AI
            </Link>
          </p>
        </motion.footer>
      </motion.div>
    </div>
  );
}
