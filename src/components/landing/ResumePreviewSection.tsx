'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { useVisitorName } from '@/hooks/useVisitorName';
import { getOnboardingProfile } from '@/lib/onboarding/onboardingData';
import { buildResumeHTML, type BuildHTMLParams } from '@/lib/resume/buildHTML';

export default function ResumePreviewSection() {
  const { firstName } = useVisitorName();
  const [show, setShow] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);

  // Delay before showing the section
  useEffect(() => {
    if (!firstName) return;
    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, [firstName]);

  // Build resume HTML from onboarding data
  const resumeHTML = useMemo(() => {
    if (!show) return '';
    const profile = getOnboardingProfile();
    const name = profile?.fullName || firstName || 'Your Name';
    const targetRole = profile?.targetRole || 'Software Engineer';
    const skills = profile?.skills?.length ? profile.skills : ['JavaScript', 'React', 'Node.js', 'Problem Solving'];
    const location = profile?.location || '';
    const experience = profile?.experienceLevel || '';

    const summaryParts = [];
    if (experience === 'fresher' || experience === '0-1') {
      summaryParts.push(`Aspiring ${targetRole}`);
    } else {
      summaryParts.push(`Experienced ${targetRole}`);
    }
    if (skills.length > 0) {
      summaryParts.push(`with expertise in ${skills.slice(0, 3).join(', ')}`);
    }
    summaryParts.push('seeking opportunities to drive impact and grow professionally.');

    const params: BuildHTMLParams = {
      contact: {
        name,
        email: 'your.email@example.com',
        phone: '',
        location,
      },
      summary: summaryParts.join(' '),
      experience: [
        {
          id: 'sample-1',
          company: 'Your Company',
          role: targetRole,
          location: location || 'Remote',
          startDate: '2023',
          endDate: 'Present',
          current: true,
          bullets: [
            `Contributed to key projects leveraging ${skills[0] || 'technical'} skills`,
            'Collaborated with cross-functional teams to deliver on business objectives',
            'Continuously improved processes and adopted best practices',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'University',
          degree: "Bachelor's",
          field: profile?.fieldOfStudy || 'Computer Science',
          startDate: '2019',
          endDate: '2023',
        },
      ],
      skills,
      certifications: [],
      template: 'modern',
      showWatermark: true,
    };

    return buildResumeHTML(params);
  }, [show, firstName]);

  // Animate resume appearing after HTML is built
  useEffect(() => {
    if (resumeHTML) {
      const timer = setTimeout(() => setResumeReady(true), 600);
      return () => clearTimeout(timer);
    }
  }, [resumeHTML]);

  if (!firstName || !show) return null;

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-orange-500/5 via-transparent to-transparent rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative">
        {/* Cortex announcement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-start gap-3 mb-8 max-w-xl mx-auto"
        >
          <div className="flex-shrink-0 mt-1">
            <CortexAvatar size={36} expression="star" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm text-white/60">
              <span className="text-neon-blue font-semibold">{firstName}</span>, exciting news!
              Agent Forge has already started working on your resume. Here&apos;s a preview of what
              your AI-optimized resume could look like.
            </p>
          </div>
        </motion.div>

        {/* Forge agent badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <AgentAvatar agentId="forge" size={32} />
          <div>
            <div className="text-sm font-semibold text-orange-400">Agent Forge</div>
            <div className="text-xs text-white/30">Resume Optimizer</div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-orange-400 font-medium">Working</span>
          </div>
        </motion.div>

        {/* Resume preview container */}
        <AnimatePresence>
          {resumeReady && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative mx-auto max-w-2xl"
            >
              {/* Glow border */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-orange-500/20 via-amber-500/10 to-transparent" />

              {/* Resume iframe container */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/50" style={{ height: '500px' }}>
                <div
                  className="w-[800px] origin-top-left"
                  style={{
                    transform: 'scale(0.6)',
                    transformOrigin: 'top center',
                    marginLeft: 'calc(50% - 400px)',
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: resumeHTML }} />
                </div>

                {/* Fade overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent" />
              </div>

              {/* Sample watermark */}
              <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-white/50 font-medium">
                Sample Preview
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8"
        >
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:opacity-90 transition-all"
          >
            Activate Agent Forge <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-white/20 mt-3">
            Sign up to get your full AI-optimized resume
          </p>
        </motion.div>
      </div>
    </section>
  );
}
