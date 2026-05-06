'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  Play,
  Volume2,
  VolumeX,
  Check,
  X,
  Zap,
  Chrome,
  Mail,
  Globe,
  Shield,
  Clock,
  Sparkles,
  Rocket,
  Crown,
  Star,
  TrendingUp,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Target,
  Briefcase,
  Send,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import LiveApplicationCounter from '@/components/landing/LiveApplicationCounter';
import { AGENT_LIST, COORDINATOR } from '@/lib/agents/registry';
import { useRegion } from '@/lib/geo';

// ──────────────────────────────────────────────────────────────────────
// CTA URLs — every conversion is attributed to the launch ad campaign.
// ──────────────────────────────────────────────────────────────────────
const CTA_HREF =
  '/get-started?utm_source=ads&utm_medium=landing&utm_campaign=launch';
const PRICING_HREF =
  '/pricing?utm_source=ads&utm_medium=landing&utm_campaign=launch';

// ──────────────────────────────────────────────────────────────────────
// AutoPlayVideo — robust autoplay-loop-muted video. Some browsers ignore
// the `autoPlay` JSX prop until React actually mounts and applies it; we
// also call .play() defensively from a useEffect with a .catch() so that
// transient errors (low memory, slow network) recover automatically.
// ──────────────────────────────────────────────────────────────────────
function AutoPlayVideo({
  src,
  className = '',
  poster,
}: {
  src: string;
  className?: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; // re-assert in case attribute was lost
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    v.addEventListener('canplay', tryPlay);
    return () => v.removeEventListener('canplay', tryPlay);
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={poster}
      // iOS Safari workaround attributes
      {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as Record<string, string>)}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────
// VideoShowcase — full-bleed demo video player with click-to-play and
// sound toggle. Distinct from the hero's looping autoplay video: this
// one stays paused until the user clicks, then plays with audio.
// ──────────────────────────────────────────────────────────────────────
function VideoShowcase() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.muted = false; // user-initiated → safe to unmute
      setMuted(false);
      v.play().catch(() => {
        // If unmuted play is blocked, fall back to muted play.
        v.muted = true;
        setMuted(true);
        v.play().catch(() => {});
      });
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-neon-purple/10 via-transparent to-transparent" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-xs font-semibold mb-4">
            <Play className="w-3 h-3" /> 90 SECOND DEMO
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold mb-3">
            Watch your AI team{' '}
            <span className="gradient-text">close interviews</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            See exactly how 6 specialist agents work together — from job
            discovery to interview-ready applications.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-neon-purple/10"
        >
          <video
            ref={ref}
            className="w-full aspect-video object-cover bg-black"
            src="/videos/hero.mp4"
            playsInline
            muted={muted}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            preload="metadata"
          />

          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play demo video"
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors group"
            >
              <span className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-2xl shadow-neon-blue/40 group-hover:scale-110 transition-transform">
                <Play className="w-9 h-9 text-white ml-1" fill="white" />
              </span>
            </button>
          )}

          {playing && (
            <button
              type="button"
              onClick={() => {
                const v = ref.current;
                if (!v) return;
                const next = !muted;
                v.muted = next;
                setMuted(next);
              }}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            href={CTA_HREF}
            className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-lg shadow-neon-blue/20"
          >
            Start Free — Watch It Work <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-white/30 mt-3">
            No credit card · 5 free applications/week · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// CountUp — animates a number when scrolled into view
// ──────────────────────────────────────────────────────────────────────
function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 1500,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    const start = 0;
    const startTs = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTs;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────
// ContactForm — inline lead-capture form. Posts to /api/contact, shows
// success/error states. Includes a hidden "company" honeypot.
// ──────────────────────────────────────────────────────────────────────
function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          company, // honeypot — must stay empty
          source: 'launch',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Could not send message.');
      }
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Something went wrong.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-neon-green/30 bg-neon-green/[0.04] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-neon-green/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-neon-green" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Message received!</h3>
        <p className="text-sm text-white/60 mb-6 max-w-sm mx-auto">
          Thanks {name.split(' ')[0] || 'there'} — we&apos;ll get back to you within
          24 hours. Meanwhile, why not try the platform free?
        </p>
        <Link
          href={CTA_HREF}
          className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2 shadow-lg shadow-neon-blue/30"
        >
          Test It Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="lp-name" className="block text-xs font-medium text-white/50 mb-1.5">Your name *</label>
          <input
            id="lp-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            placeholder="Jane Doe"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-neon-blue/50 focus:ring-2 focus:ring-neon-blue/15 transition-all"
          />
        </div>
        <div>
          <label htmlFor="lp-email" className="block text-xs font-medium text-white/50 mb-1.5">Email *</label>
          <input
            id="lp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
            placeholder="jane@example.com"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-neon-blue/50 focus:ring-2 focus:ring-neon-blue/15 transition-all"
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="lp-phone" className="block text-xs font-medium text-white/50 mb-1.5">Phone (optional)</label>
        <input
          id="lp-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={40}
          placeholder="+1 555 0100"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-neon-blue/50 focus:ring-2 focus:ring-neon-blue/15 transition-all"
        />
      </div>
      <div className="mb-5">
        <label htmlFor="lp-msg" className="block text-xs font-medium text-white/50 mb-1.5">How can we help? *</label>
        <textarea
          id="lp-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={5}
          maxLength={4000}
          rows={4}
          placeholder="Tell us about your job search, partnership idea, or any questions you have..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-neon-blue/50 focus:ring-2 focus:ring-neon-blue/15 transition-all resize-none"
        />
      </div>

      {/* Honeypot — invisible to humans, bots fill it */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="lp-company">Company (leave empty)</label>
        <input
          id="lp-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-3" role="alert">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="btn-primary text-sm px-6 py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send Message
            </>
          )}
        </button>
        <p className="text-[11px] text-white/30 text-center sm:text-left">
          We respond within 24 hours · Or just{' '}
          <Link href={CTA_HREF} className="text-neon-blue hover:underline">
            test it free now
          </Link>
        </p>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Pricing plan definitions
// ──────────────────────────────────────────────────────────────────────
const PRICING_PLANS = [
  {
    key: 'free' as const,
    name: 'Free',
    icon: Rocket,
    tagline: 'Try the platform risk-free',
    features: [
      '5 applications per week',
      'All 6 AI agents',
      'AI resume builder',
      'Interview prep tools',
      'Job search across 6+ portals',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    icon: Zap,
    tagline: 'Best for active job seekers',
    features: [
      '20 applications per day',
      'All 6 AI agents',
      'Auto-apply automation',
      'ATS-optimized resumes',
      'Priority AI processing',
      'Email support',
    ],
    cta: 'Get Pro',
    highlight: true,
  },
  {
    key: 'max' as const,
    name: 'Max',
    icon: Crown,
    tagline: 'For power users',
    features: [
      '50 applications per day',
      'All 6 AI agents',
      'Advanced analytics',
      'Priority support',
      'Dedicated onboarding',
      'Early access to new agents',
    ],
    cta: 'Get Max',
    highlight: false,
  },
];

// ──────────────────────────────────────────────────────────────────────
// FAQ items
// ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How fast can I start getting interviews?',
    a: 'Most users receive their first interview invite within 7–14 days. Once you upload your resume and pick a target role, agents start working within minutes.',
  },
  {
    q: 'Will the AI send spammy or wrong applications?',
    a: 'No. Agent Sentinel reviews every application for accuracy and quality before sending. Each cover letter is individually written for the specific job — never a template.',
  },
  {
    q: 'Do I need to give up my email password?',
    a: 'Never. We use OAuth (the same secure flow used by LinkedIn and Calendly). You can revoke access anytime from your Google or Microsoft account.',
  },
  {
    q: 'What if I already have a job and want to keep it private?',
    a: 'Your search is fully confidential. We never contact your current employer, and applications are sent only to companies you approve.',
  },
  {
    q: 'Is there a money-back guarantee?',
    a: 'Yes — 7-day money-back guarantee on every paid plan. If you\'re not seeing value, request a full refund within 7 days.',
  },
  {
    q: 'How is this different from job aggregators?',
    a: 'Job aggregators show you listings. 3BOX AI applies to them for you — with a custom resume and cover letter for each one, while you sleep.',
  },
];

// ══════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════
export default function LaunchPageClient() {
  const { data: session } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [yearly, setYearly] = useState(true);
  const region = useRegion();

  const getPrice = (key: 'pro' | 'max'): { display: number; total: number } => {
    if (region.isLoading) return { display: 0, total: 0 };
    const p = region.pricing[key];
    if (!p || typeof p !== 'object' || !('monthly' in p))
      return { display: 0, total: 0 };
    const pp = p as { monthly: number; yearly: number };
    return yearly
      ? { display: Math.round(pp.yearly / 12), total: pp.yearly }
      : { display: pp.monthly, total: pp.monthly * 12 };
  };

  return (
    <div className="min-h-screen text-white bg-[#0a0a0f]">
      {/* ════════════════════════════════════════════════════════
          STICKY MINIMAL TOP BAR — logo + 1 CTA only
          (Replaces full Navbar — landing pages should be focused.)
          ════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" aria-label="3BOX AI home" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#contact"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/65 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" /> Contact
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="btn-primary text-sm px-4 py-2 sm:px-5 sm:py-2.5 inline-flex items-center gap-1.5"
              >
                Dashboard <LayoutDashboard className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={CTA_HREF}
                className="btn-primary text-sm px-4 py-2 sm:px-5 sm:py-2.5 inline-flex items-center gap-1.5 shadow-lg shadow-neon-blue/20"
              >
                Test It Free <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          1 · HERO — split layout, big autoplay video on right
          ════════════════════════════════════════════════════════ */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Background — gradient mesh + grid */}
        <div className="absolute inset-0 bg-grid opacity-[0.15]" aria-hidden="true" />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-radial from-neon-purple/15 via-neon-blue/8 to-transparent rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-radial from-neon-blue/10 via-transparent to-transparent rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — copy + CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neon-blue">
                AI Agents Working Right Now
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-6"
            >
              Stop scrolling jobs.
              <br />
              <span className="gradient-text">Wake up to interviews.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg text-white/55 mb-8 leading-relaxed max-w-lg"
            >
              6 specialist AI agents search 6+ job platforms, tailor your resume
              for every role, and submit personalized applications — all while
              you sleep. You wake up. You interview.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              {session ? (
                <Link
                  href="/dashboard"
                  className="btn-primary text-base px-8 py-3.5 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30"
                >
                  Open Dashboard <LayoutDashboard className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href={CTA_HREF}
                    className="btn-primary text-base px-8 py-3.5 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30"
                  >
                    Test It Free <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-white/80 text-sm font-medium hover:text-white hover:border-white/30 hover:bg-white/[0.03] transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Contact Me
                  </Link>
                </>
              )}
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/40"
            >
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neon-green" /> No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neon-green" /> 7-day refund
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-neon-blue" /> Bank-grade encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Setup in 2 min
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8"
            >
              {!session && <LiveApplicationCounter />}
            </motion.div>
          </div>

          {/* Right — big AUTOPLAY video in a stylized "browser" frame.
              Uses hero.mp4 (proven working) instead of hero1.mp4 which
              wasn't playing reliably. AutoPlayVideo wraps a defensive
              .play().catch() retry. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-radial from-neon-blue/25 via-neon-purple/15 to-transparent blur-2xl" aria-hidden="true" />

            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-2 shadow-2xl shadow-neon-blue/20 backdrop-blur-sm">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-3 text-[10px] text-white/30 font-mono">3box.ai/dashboard</span>
              </div>

              <AutoPlayVideo
                className="w-full aspect-video object-cover rounded-lg bg-black"
                src="/videos/hero.mp4"
              />

              <div className="absolute -top-3 -right-3 hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0a0a0f] border border-white/10 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                <span className="text-[10px] font-semibold text-white">6 agents online</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center gap-3 mt-5">
              {AGENT_LIST.slice(0, 6).map((agent) => (
                <div
                  key={agent.id}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                  title={agent.displayName}
                >
                  <AgentAvatar agentId={agent.id} size={28} />
                </div>
              ))}
              <span className="text-[10px] text-white/30 ml-2">+ Cortex coordinating</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          2 · VIDEO SHOWCASE — full-bleed demo with click-to-play
          ════════════════════════════════════════════════════════ */}
      <VideoShowcase />

      {/* ════════════════════════════════════════════════════════
          3 · STATS BAR
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-12 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {[
              { value: 15000, suffix: '+', label: 'Applications sent', icon: Target, color: 'text-neon-blue' },
              { value: 8, suffix: '+', label: 'Hours saved per week', icon: Clock, color: 'text-amber-400' },
              { value: 87, suffix: '%', label: 'Match accuracy', icon: TrendingUp, color: 'text-neon-green' },
              { value: 6, suffix: '', label: 'AI agents at your service', icon: Sparkles, color: 'text-neon-purple' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[11px] sm:text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          3 · OLD WAY VS WITH 3BOX
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
              THE NEW WAY TO JOB HUNT
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              The job hunt is <span className="gradient-text">broken</span>.
              <br />
              We fixed it.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Old way */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-6 sm:p-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-300">The Old Way</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Spend 3+ hours/day scrolling LinkedIn & Indeed',
                  'Manually rewrite your resume for every job',
                  'Send the same generic cover letter 50 times',
                  'Get ghosted because of ATS keyword filters',
                  'Burn out before week 2',
                  'Watch friends land roles while you wait',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/55">
                    <X className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* New way */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-neon-green/20 bg-gradient-to-br from-neon-green/[0.06] to-neon-blue/[0.03] p-6 sm:p-8 relative"
            >
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-neon-green/15 flex items-center justify-center">
                  <Check className="w-4 h-4 text-neon-green" />
                </div>
                <h3 className="text-lg font-bold text-neon-green">With 3BOX AI</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'AI scans 6+ job platforms 24/7 for you',
                  'Resume tailored automatically for every role',
                  'Each cover letter written from scratch by AI',
                  'ATS-optimized to beat keyword filters',
                  'You sleep — agents work',
                  'Wake up to a queue of interview invites',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                    <Check className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={CTA_HREF}
                className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2 shadow-lg shadow-neon-blue/20 mt-6"
              >
                Test It Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          4 · MEET THE AGENTS
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/5 via-transparent to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold mb-4">
              MEET THE TEAM
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              6 specialists. <span className="gradient-text">1 mission.</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Each agent is a domain expert. Together, they handle every step
              of your job search — coordinated by Cortex.
            </p>
          </motion.div>

          {/* Cortex coordinator card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-neon-purple/20 bg-white/[0.02] p-6 sm:p-7 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          >
            <CortexAvatar size={64} pulse />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{COORDINATOR.displayName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-[10px] font-semibold uppercase tracking-wider">
                  Coordinator
                </span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                {COORDINATOR.role}. Orchestrates all 6 agents and keeps your
                job hunt running 24/7 in the background.
              </p>
            </div>
          </motion.div>

          {/* 6 agents */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENT_LIST.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.03] transition-all flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AgentAvatar agentId={agent.id} size={44} />
                  <div className="min-w-0">
                    <div className="text-base font-bold text-white">{agent.name}</div>
                    <div className={`text-xs font-medium ${agent.color}`}>{agent.role}</div>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mb-3 flex-1">
                  {agent.shortDescription}
                </p>
                <p className="text-[11px] italic text-white/30 leading-relaxed border-l-2 border-white/10 pl-3">
                  &ldquo;{agent.storyLine}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={CTA_HREF}
              className="btn-primary text-base px-8 py-3.5 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30"
            >
              Activate My Team <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-white/80 text-sm font-medium hover:text-white hover:border-white/30 hover:bg-white/[0.03] transition-colors"
            >
              <Mail className="w-4 h-4" /> Have questions? Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          5 · HOW IT WORKS — vertical timeline
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              From signup to <span className="gradient-text">interview-ready</span>
              <br />
              in under 5 minutes
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[27px] sm:left-[35px] top-2 bottom-2 w-px bg-gradient-to-b from-neon-blue via-neon-purple to-neon-green" aria-hidden="true" />

            {[
              { icon: Briefcase, title: 'Upload your resume', desc: 'Drop a PDF or DOCX. Our AI extracts your skills, experience, and goals in seconds.', when: '0:30' },
              { icon: Target, title: 'Pick your target role', desc: 'Tell us what you want. Senior Product Manager? Backend Engineer? Designer? We handle the rest.', when: '0:45' },
              { icon: Moon, title: 'Sleep — agents go to work', desc: 'Scout finds jobs. Forge tailors your resume. Sentinel quality-checks. Archer applies. All while you rest.', when: 'overnight' },
              { icon: Sun, title: 'Wake up to interviews', desc: 'Open your dashboard to see exactly which jobs got applied, recruiter replies, and interview prep ready to go.', when: 'tomorrow' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative flex gap-4 sm:gap-6 mb-8 last:mb-0"
              >
                <div className="relative flex-shrink-0">
                  <div className="relative w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#0a0a0f] border border-white/15 text-[9px] font-bold text-white/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <span className="text-[10px] font-mono text-white/30 uppercase">{step.when}</span>
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href={CTA_HREF}
              className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-lg shadow-neon-blue/30"
            >
              Start in 2 Minutes <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          6 · 5 CHANNELS
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              5 ways to <span className="gradient-text">apply</span>
            </h2>
            <p className="text-white/45 max-w-md mx-auto text-sm">
              Archer picks the best channel for each job, maximizing your
              response rate.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { icon: Zap, label: 'ATS API', desc: 'Direct submission to Greenhouse & Lever', color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: Chrome, label: 'Chrome Extension', desc: 'Auto-apply on LinkedIn, Indeed, Naukri, Workday', color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
              { icon: Mail, label: 'Your Email', desc: 'Send from your Gmail or Outlook for personal touch', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Globe, label: 'Cold Email', desc: 'AI-verified HR emails with tailored cover letters', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { icon: Shield, label: 'Portal Queue', desc: 'Pre-filled forms ready for one-click submission', color: 'text-white/50', bg: 'bg-white/5' },
            ].map((ch, i) => (
              <motion.div
                key={ch.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center"
              >
                <div className={`w-10 h-10 rounded-xl ${ch.bg} flex items-center justify-center mx-auto mb-3`}>
                  <ch.icon className={`w-5 h-5 ${ch.color}`} />
                </div>
                <div className="text-sm font-semibold text-white mb-1">{ch.label}</div>
                <div className="text-[11px] text-white/35 leading-snug">{ch.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          7 · PRICING
          ════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-purple/5 via-transparent to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold mb-4">
              SIMPLE · TRANSPARENT · CANCEL ANYTIME
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              Pricing built for <span className="gradient-text">winners</span>
            </h2>
            <p className="text-white/50 max-w-md mx-auto text-sm">
              Start free. Upgrade only when you&apos;re serious about landing
              the role.
            </p>

            <div className="inline-flex items-center gap-3 mt-8 p-1 rounded-full bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${!yearly ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${yearly ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Yearly
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-green/20 text-neon-green font-bold">
                  Save 20%
                </span>
              </button>
            </div>

            {!region.isLoading && (
              <p className="text-[11px] text-white/30 mt-3">
                Showing prices for {region.country} in {region.currency}
              </p>
            )}
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan, i) => {
              const isPaid = plan.key !== 'free';
              const price = isPaid ? getPrice(plan.key as 'pro' | 'max') : { display: 0, total: 0 };
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-2xl border p-6 sm:p-7 flex flex-col ${plan.highlight ? 'border-neon-blue/40 bg-gradient-to-b from-neon-blue/[0.06] to-transparent shadow-xl shadow-neon-blue/10 lg:scale-[1.02]' : 'border-white/10 bg-white/[0.02]'}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <plan.icon className="w-5 h-5 text-white/70" />
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-white/40 mb-5">{plan.tagline}</p>

                  <div className="mb-1">
                    {plan.key === 'free' ? (
                      <div>
                        <span className="text-4xl font-bold text-white">{region.currencySymbol}0</span>
                        <span className="text-xs text-white/40 ml-1">forever</span>
                      </div>
                    ) : region.isLoading ? (
                      <div className="h-10 w-32 bg-white/5 rounded animate-pulse" />
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-white">
                          {region.currencySymbol}
                          {price.display.toLocaleString()}
                        </span>
                        <span className="text-xs text-white/40 ml-1">/mo</span>
                      </div>
                    )}
                  </div>
                  {isPaid && yearly && !region.isLoading && (
                    <p className="text-[11px] text-neon-green mb-5">
                      {region.currencySymbol}{price.total.toLocaleString()} billed yearly
                    </p>
                  )}
                  {isPaid && !yearly && <div className="mb-5" />}

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.key === 'free' ? CTA_HREF : `${PRICING_HREF}#${plan.key}`}
                    className={
                      plan.highlight
                        ? 'btn-primary text-sm px-6 py-3 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30'
                        : 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 hover:border-white/25 transition-colors'
                    }
                  >
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs text-white/30 mt-8">
            All paid plans include a 7-day money-back guarantee · Cancel anytime
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          8 · TESTIMONIALS
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-16">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Why job seekers <span className="gradient-text">love 3BOX AI</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { quote: 'Got 3 interviews in my first week. The AI applies way better than I ever did.', name: 'Priya R.', role: 'Software Engineer' },
              { quote: 'Hands down the best $29 I\'ve ever spent. Saves me 10+ hours a week.', name: 'Marcus T.', role: 'Product Manager' },
              { quote: 'Landed a senior role 4 weeks after signing up. Cover letters were spot-on.', name: 'Elena S.', role: 'UX Designer' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/75 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="text-xs">
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-white/40">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          9 · CONTACT FORM (NEW)
          ════════════════════════════════════════════════════════ */}
      <section id="contact" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/8 via-transparent to-transparent" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold mb-4">
              <Mail className="w-3 h-3" /> WE&apos;RE LISTENING
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              Have questions? <span className="gradient-text">Drop us a note.</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm">
              For partnerships, support, custom plans, or just to say hi —
              we typically reply within 24 hours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          10 · FAQ
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-10"
          >
            Got <span className="gradient-text">questions?</span>
          </motion.h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white/85">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === i && (
                    <p className="text-sm text-white/55 mt-3 leading-relaxed">{faq.a}</p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-white/35 mt-8">
            Still curious?{' '}
            <Link href="#contact" className="text-neon-blue hover:underline">
              Send us a message →
            </Link>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          11 · FINAL CTA
          ════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/10 via-neon-purple/5 to-transparent" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
              Tonight, you sleep.
              <br />
              <span className="gradient-text">Tomorrow, you interview.</span>
            </h2>
            <p className="text-white/55 mb-10 max-w-md mx-auto">
              Join thousands of job seekers who&apos;ve hired their AI team and
              never looked back.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {session ? (
                <Link
                  href="/dashboard"
                  className="btn-primary text-base px-8 py-4 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30"
                >
                  Open Dashboard <LayoutDashboard className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href={CTA_HREF}
                    className="btn-primary text-base px-8 py-4 inline-flex items-center justify-center gap-2 shadow-lg shadow-neon-blue/30"
                  >
                    Test It Free <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/15 text-white/80 text-sm font-medium hover:text-white hover:border-white/30 hover:bg-white/[0.03] transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Contact Me
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mt-10">
              {AGENT_LIST.map((agent) => (
                <div key={agent.id} className="opacity-50 hover:opacity-100 transition-opacity">
                  <AgentAvatar agentId={agent.id} size={22} />
                </div>
              ))}
              <div className="opacity-50 hover:opacity-100 transition-opacity ml-1">
                <CortexAvatar size={24} />
              </div>
            </div>
            <p className="text-[11px] text-white/25 mt-3">
              6 AI agents + Cortex coordinator · Working 24/7 to land your dream job
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MINIMAL FOOTER — legal + contact email only.
          No nav menu — landing pages stay focused.
          ════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[11px] text-white/30">
              © {new Date().getFullYear()} 3BOX AI. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-white/40">
            <a href="mailto:nishinth.m@wartens.com" className="hover:text-white transition-colors">
              nishinth.m@wartens.com
            </a>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
