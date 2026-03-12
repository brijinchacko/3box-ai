'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, MapPin, ArrowRight, TrendingUp, Clock, Briefcase,
  GraduationCap, Target, Star, Quote, Filter,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useVisitorName } from '@/hooks/useVisitorName';

// ── Types ──
interface CaseStudy {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: string;
  gradientFrom: string;
  gradientTo: string;
  tags: string[];
  before: string;
  after: string;
  metric: string;
  metricLabel: string;
  story: string[];
  quote: string;
  agentsUsed: string[];
}

// ── Filter categories ──
const filters = [
  { key: 'all', label: 'All Stories' },
  { key: 'fresher', label: 'Freshers' },
  { key: 'career-switch', label: 'Career Switch' },
  { key: 'salary-growth', label: 'Salary Growth' },
  { key: 'career-break', label: 'Career Break' },
  { key: 'laid-off', label: 'Bounce Back' },
];

// ── Case Studies Data ──
const caseStudies: CaseStudy[] = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    initials: 'PS',
    role: 'Software Developer',
    location: 'Bengaluru, Karnataka',
    gradientFrom: '#00d4ff',
    gradientTo: '#a855f7',
    tags: ['fresher'],
    before: 'B.Tech fresher with no interview calls',
    after: 'Software Developer at a leading fintech startup',
    metric: '3 Weeks',
    metricLabel: 'From graduate to hired',
    story: [
      'Priya graduated from a tier-2 engineering college in Karnataka with a B.Tech in Computer Science. Despite good grades, she spent four months applying to over 200 jobs on traditional portals without a single interview call. Her resume was generic, and she had no idea what recruiters were looking for.',
      'After signing up for 3BOX AI, Agent Forge analyzed her resume and found it scored just 32% on ATS compatibility. The agent rewrote her resume, highlighting her final year project on a payment gateway and her open-source contributions. Agent Scout then identified 45 matching roles she had never discovered on her own.',
      'Within three weeks, Priya received five interview calls. Agent Atlas prepared her with company-specific mock interviews. She cracked her third interview and landed a Software Developer role at a Bengaluru fintech startup with a package of 6.5 LPA.',
    ],
    quote: 'I was losing hope after four months of silence. 3BOX AI did not just fix my resume, it showed me jobs I did not know existed. The mock interviews felt like a cheat code.',
    agentsUsed: ['Forge', 'Scout', 'Atlas'],
  },
  {
    id: 'rahul-mehta',
    name: 'Rahul Mehta',
    initials: 'RM',
    role: 'Senior Backend Engineer',
    location: 'Mumbai, Maharashtra',
    gradientFrom: '#ff0080',
    gradientTo: '#ff8c00',
    tags: ['salary-growth'],
    before: '5 years at the same company, stagnant salary',
    after: 'Senior Backend Engineer with 40% salary hike',
    metric: '40%',
    metricLabel: 'Salary increase',
    story: [
      'Rahul had been working at a mid-size IT services company in Mumbai for five years. His salary had barely moved beyond annual increments, and he felt stuck in a loop of maintaining legacy Java applications. He knew he was worth more but did not know how to position himself in the market.',
      'Agent Sage created a personalized learning path focused on cloud architecture and microservices. In parallel, Agent Forge crafted three versions of his resume, each tailored for different target roles. The Salary Estimator tool showed him he was being underpaid by 35% compared to market rates.',
      'Agent Scout surfaced backend roles at product companies he admired. Within five weeks, Rahul had three offers on the table. He accepted a Senior Backend Engineer position at a Mumbai-based SaaS company with a 40% salary hike and a team lead track.',
    ],
    quote: 'I always felt I deserved more but never had the data to back it up. 3BOX AI gave me the numbers, the skills roadmap, and the confidence to make the jump.',
    agentsUsed: ['Sage', 'Forge', 'Scout'],
  },
  {
    id: 'ananya-krishnan',
    name: 'Ananya Krishnan',
    initials: 'AK',
    role: 'Product Manager',
    location: 'Chennai, Tamil Nadu',
    gradientFrom: '#a855f7',
    gradientTo: '#00ff88',
    tags: ['career-break'],
    before: '3-year career break after starting a family',
    after: 'Product Manager at an EdTech company',
    metric: '1 Month',
    metricLabel: 'Career break to comeback',
    story: [
      'Ananya was a Business Analyst at an IT consulting firm before taking a three-year career break after the birth of her daughter. When she decided to return to work, she felt the industry had moved on without her. Her old resume felt outdated, and she was unsure if anyone would hire a mother returning after a gap.',
      'Agent Forge rebuilt her resume to frame the career break positively, highlighting freelance consulting she did during the gap and transferable skills. Agent Sage recommended a product management certification course and guided her through it in three weeks. The AI identified that her BA experience was a natural fit for PM roles.',
      'Agent Archer crafted compelling cover letters for each application, addressing the career gap head-on with confidence. Within one month, Ananya joined a Chennai EdTech startup as a Product Manager, managing a team of six engineers.',
    ],
    quote: 'I was so nervous about the gap on my resume. 3BOX AI helped me see that my experience as a mother and my consulting work were actually strengths, not weaknesses.',
    agentsUsed: ['Forge', 'Sage', 'Archer'],
  },
  {
    id: 'vikram-patel',
    name: 'Vikram Patel',
    initials: 'VP',
    role: 'Data Analyst',
    location: 'Ahmedabad, Gujarat',
    gradientFrom: '#00ff88',
    gradientTo: '#00d4ff',
    tags: ['career-switch'],
    before: 'Mechanical engineer wanting to break into tech',
    after: 'Data Analyst at a consulting firm',
    metric: '6 Weeks',
    metricLabel: 'From mechanical to tech',
    story: [
      'Vikram graduated with a degree in Mechanical Engineering from an Ahmedabad college. While his classmates joined manufacturing firms, Vikram dreamed of working in tech. He taught himself Python and SQL through YouTube tutorials but had no idea how to transition officially without a CS degree.',
      'Agent Sage assessed his skills and created a focused 4-week upskilling path covering Pandas, Power BI, and statistics. Agent Forge built a resume that positioned his engineering problem-solving skills as assets for data analytics. The AI highlighted his self-taught projects as proof of initiative.',
      'Agent Scout found Data Analyst roles at companies that valued diverse educational backgrounds. Vikram received two offers within six weeks and joined a well-known consulting firm in Ahmedabad as a Data Analyst, proving that your degree does not define your career.',
    ],
    quote: 'Everyone told me to stick with mechanical engineering. 3BOX AI showed me the exact steps to cross over into tech. The upskilling path was like having a personal mentor.',
    agentsUsed: ['Sage', 'Forge', 'Scout'],
  },
  {
    id: 'deepa-nair',
    name: 'Deepa Nair',
    initials: 'DN',
    role: 'Full-Stack Developer (Remote)',
    location: 'Kochi, Kerala',
    gradientFrom: '#ff8c00',
    gradientTo: '#ff0080',
    tags: ['salary-growth', 'career-switch'],
    before: 'Freelancer struggling with inconsistent income',
    after: 'Remote full-stack developer at a US startup',
    metric: '3x',
    metricLabel: 'Income increase',
    story: [
      'Deepa had been freelancing as a web developer from Kochi for two years. While she loved the flexibility, the income was unpredictable. Some months were good, others were empty. She wanted the stability of a full-time role but feared losing the remote lifestyle she cherished.',
      'Agent Forge transformed her freelance portfolio into a structured resume that highlighted project impact and client testimonials. Agent Scout specifically filtered for remote-first companies and international startups hiring from India. The AI found 28 perfect matches she had never come across.',
      'Agent Atlas prepared her for asynchronous interview formats common at remote companies. Deepa landed a full-stack developer position at a San Francisco-based startup, working remotely from Kochi with a salary three times her average freelance income.',
    ],
    quote: 'I thought remote jobs at US companies were only for IIT graduates. 3BOX AI proved me wrong. I am now earning in dollars while living in my hometown.',
    agentsUsed: ['Forge', 'Scout', 'Atlas'],
  },
  {
    id: 'arjun-singh',
    name: 'Arjun Singh',
    initials: 'AS',
    role: 'Frontend Developer',
    location: 'Delhi NCR',
    gradientFrom: '#00d4ff',
    gradientTo: '#ff0080',
    tags: ['laid-off'],
    before: 'Laid off during startup downsizing',
    after: 'Frontend Developer at a growing healthtech firm',
    metric: '2 Weeks',
    metricLabel: 'From laid off to three offers',
    story: [
      'Arjun was working as a frontend developer at a Delhi-based startup when the company downsized and let go of 40% of its workforce. The layoff hit him hard, both financially and emotionally. With EMIs running and savings limited, he needed a job fast.',
      'He signed up for 3BOX AI the same day. Agent Forge quickly optimized his resume, turning his startup experience into compelling achievement stories. Agent Scout ran continuously, scanning job boards every hour for urgent hiring roles in Delhi NCR. Agent Archer sent out tailored applications to 30 companies in 48 hours.',
      'Within two weeks, Arjun had three solid offers. He chose a Frontend Developer role at a healthtech company in Gurugram that offered better stability, a 15% higher salary, and health insurance for his family.',
    ],
    quote: 'When you are laid off, you feel like the ground has been pulled from under you. 3BOX AI became my support system. Three offers in two weeks felt unreal.',
    agentsUsed: ['Forge', 'Scout', 'Archer'],
  },
  {
    id: 'meera-joshi',
    name: 'Meera Joshi',
    initials: 'MJ',
    role: 'EdTech Product Specialist',
    location: 'Pune, Maharashtra',
    gradientFrom: '#a855f7',
    gradientTo: '#ff8c00',
    tags: ['career-switch'],
    before: 'School teacher wanting to enter the tech industry',
    after: 'Product Specialist at a top EdTech company',
    metric: '8 Weeks',
    metricLabel: 'Teacher to tech professional',
    story: [
      'Meera had been teaching mathematics at a Pune school for six years. She loved education but felt limited by the traditional system. When EdTech companies started transforming how students learn, she wanted to be part of that change but had no tech background on paper.',
      'Agent Sage designed a learning path focused on product thinking, user research, and basic analytics. Agent Forge created a resume that reframed her six years of teaching as deep domain expertise in education and learner behavior. The AI positioned her classroom innovations as product experiments.',
      'Agent Scout identified EdTech companies specifically looking for people with education backgrounds. Within eight weeks, Meera joined one of India\'s top EdTech companies as a Product Specialist, bridging the gap between educators and engineers.',
    ],
    quote: 'I thought tech companies only wanted coders. 3BOX AI showed me that my teaching experience was exactly what EdTech companies needed. I just needed help telling that story.',
    agentsUsed: ['Sage', 'Forge', 'Scout'],
  },
  {
    id: 'saurabh-das',
    name: 'Saurabh Das',
    initials: 'SD',
    role: 'Associate Software Engineer',
    location: 'Kolkata, West Bengal',
    gradientFrom: '#00ff88',
    gradientTo: '#a855f7',
    tags: ['fresher'],
    before: 'Tier-2 college grad overlooked by top recruiters',
    after: 'Associate Software Engineer at a major MNC',
    metric: '4 Weeks',
    metricLabel: 'From overlooked to MNC hire',
    story: [
      'Saurabh graduated from a tier-2 college in Kolkata with decent skills in Java and React but no brand name on his resume. Campus placements favored students from premium institutes, and off-campus drives felt like a lottery. He applied to 150 jobs with zero responses.',
      'Agent Sentinel analyzed his applications and found that 80% were being rejected by ATS systems because of formatting issues and missing keywords. Agent Forge rebuilt his resume from scratch, optimizing it for each target company\'s ATS. His ATS score jumped from 28% to 92%.',
      'Agent Scout identified companies with a track record of hiring from non-premier colleges. Agent Atlas prepared him with technical interview question banks specific to each company. Saurabh cracked the interview process at a major MNC and joined as an Associate Software Engineer in just four weeks.',
    ],
    quote: 'My college name was holding me back, or so I thought. The real problem was that my resume never reached human eyes. Once 3BOX AI fixed that, everything changed.',
    agentsUsed: ['Sentinel', 'Forge', 'Scout', 'Atlas'],
  },
];

// ── Agent color map ──
const agentColors: Record<string, string> = {
  Forge: 'text-orange-400',
  Scout: 'text-emerald-400',
  Atlas: 'text-purple-400',
  Archer: 'text-pink-400',
  Sage: 'text-cyan-400',
  Sentinel: 'text-yellow-400',
};

// ── Component ──
export default function CaseStudiesClient() {
  const { firstName } = useVisitorName();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered =
    activeFilter === 'all'
      ? caseStudies
      : caseStudies.filter((c) => c.tags.includes(activeFilter));

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/50 mb-6">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              Real People. Real Results.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
              Real Stories,{' '}
              <span className="gradient-text">Real Careers</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              See how professionals across India used 3BOX AI to land dream jobs,
              switch careers, and unlock their true potential.
            </p>
          </motion.div>

          {/* Stat bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12"
          >
            {[
              { icon: TrendingUp, value: '40%', label: 'Avg salary increase' },
              { icon: Clock, value: '3 Weeks', label: 'Avg time to hire' },
              { icon: Target, value: '92%', label: 'Avg ATS score after' },
              { icon: Star, value: '4.9/5', label: 'User satisfaction' },
            ].map((s, i) => (
              <div
                key={s.label}
                className="card text-center py-4"
              >
                <s.icon className="w-5 h-5 text-neon-blue mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Filter pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
            <Filter className="w-4 h-4 text-white/30 mr-1" />
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === f.key
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>

          {/* Case study cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {filtered.map((cs, i) => (
                <motion.article
                  key={cs.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="card overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    {/* Avatar */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${cs.gradientFrom}, ${cs.gradientTo})`,
                      }}
                    >
                      {cs.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-white">{cs.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/40">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {cs.role}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {cs.location}
                        </span>
                      </div>
                    </div>
                    {/* Metric badge */}
                    <div className="sm:text-right shrink-0">
                      <div
                        className="text-2xl font-extrabold bg-clip-text text-transparent"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${cs.gradientFrom}, ${cs.gradientTo})`,
                        }}
                      >
                        {cs.metric}
                      </div>
                      <div className="text-xs text-white/30">{cs.metricLabel}</div>
                    </div>
                  </div>

                  {/* Before → After */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1 rounded-xl bg-red-500/5 border border-red-500/10 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-red-400/60 font-semibold mb-1">Before</div>
                      <div className="text-sm text-white/50">{cs.before}</div>
                    </div>
                    <div className="hidden sm:flex items-center">
                      <ArrowRight className="w-5 h-5 text-white/20" />
                    </div>
                    <div className="flex-1 rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-400/60 font-semibold mb-1">After</div>
                      <div className="text-sm text-white/50">{cs.after}</div>
                    </div>
                  </div>

                  {/* Story */}
                  <div className="space-y-3 mb-6">
                    {cs.story.map((p, pi) => (
                      <p key={pi} className="text-sm text-white/45 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative rounded-xl bg-white/[0.03] border border-white/5 px-5 py-4 mb-5">
                    <Quote className="w-5 h-5 text-neon-purple/30 absolute top-3 left-3" />
                    <p className="text-sm text-white/60 italic pl-6">
                      &ldquo;{cs.quote}&rdquo;
                    </p>
                    <div className="text-xs text-white/25 mt-2 pl-6">— {cs.name}</div>
                  </div>

                  {/* Agents used */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-white/20">Agents used:</span>
                    {cs.agentsUsed.map((a) => (
                      <span
                        key={a}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 ${agentColors[a] || 'text-white/40'}`}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              No stories match this filter yet. Check back soon!
            </div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <h2 className="text-3xl font-extrabold mb-4">
              {firstName ? `${firstName}, Ready` : 'Ready'} to Write <span className="gradient-text">Your Story</span>?
            </h2>
            <p className="text-white/40 mb-8 max-w-lg mx-auto">
              Join thousands of professionals who transformed their careers with
              3BOX AI. Your success story starts today.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold hover:opacity-90 transition-opacity text-lg"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
