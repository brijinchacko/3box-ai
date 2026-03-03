'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, ArrowRight, ArrowLeft, Clock, CheckCircle2,
  BarChart3, Target, Lightbulb, Zap, Star, TrendingUp
} from 'lucide-react';

type Step = 'role-select' | 'profile' | 'assessment' | 'results';

const popularRoles = [
  'AI Engineer', 'Data Scientist', 'Full Stack Developer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer', 'Cloud Architect',
  'Cybersecurity Analyst', 'PLC Programmer', 'Mobile Developer', 'Blockchain Developer',
];

const demoQuestions = [
  {
    id: '1', type: 'mcq' as const, skill: 'Programming Fundamentals',
    question: 'Which data structure uses LIFO (Last In, First Out) ordering?',
    options: ['Queue', 'Stack', 'Linked List', 'Hash Table'],
    difficulty: 'beginner' as const, timeLimit: 60,
  },
  {
    id: '2', type: 'mcq' as const, skill: 'Machine Learning',
    question: 'What is the purpose of a validation set in machine learning?',
    options: ['To train the model', 'To tune hyperparameters', 'To test final performance', 'To generate features'],
    difficulty: 'intermediate' as const, timeLimit: 60,
  },
  {
    id: '3', type: 'mcq' as const, skill: 'Deep Learning',
    question: 'Which activation function helps mitigate the vanishing gradient problem?',
    options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
    difficulty: 'intermediate' as const, timeLimit: 45,
  },
  {
    id: '4', type: 'scenario' as const, skill: 'System Design',
    question: 'You need to design a real-time recommendation engine for an e-commerce platform serving 1M+ users. Describe your high-level architecture approach, including data pipeline, model serving, and latency considerations.',
    difficulty: 'advanced' as const, timeLimit: 180,
  },
  {
    id: '5', type: 'mcq' as const, skill: 'MLOps',
    question: 'Which tool is commonly used for ML experiment tracking?',
    options: ['Jenkins', 'MLflow', 'Terraform', 'Ansible'],
    difficulty: 'intermediate' as const, timeLimit: 45,
  },
];

const demoResults = {
  targetRole: 'AI Engineer',
  overallScore: 68,
  skillScores: [
    { skill: 'Python', score: 88, level: 'Advanced', color: 'bg-neon-green' },
    { skill: 'Machine Learning', score: 75, level: 'Intermediate', color: 'bg-neon-blue' },
    { skill: 'Deep Learning', score: 62, level: 'Intermediate', color: 'bg-neon-purple' },
    { skill: 'MLOps', score: 45, level: 'Beginner', color: 'bg-neon-orange' },
    { skill: 'System Design', score: 55, level: 'Beginner', color: 'bg-neon-pink' },
    { skill: 'Data Engineering', score: 70, level: 'Intermediate', color: 'bg-cyan-400' },
  ],
  gaps: [
    { skill: 'MLOps', current: 45, required: 75, priority: 'high' as const },
    { skill: 'System Design', current: 55, required: 80, priority: 'high' as const },
    { skill: 'Deep Learning', current: 62, required: 80, priority: 'medium' as const },
  ],
  recommendations: [
    'Focus on MLOps tools (MLflow, Kubeflow, Docker) — this is your biggest gap',
    'Practice system design with real-world ML architecture problems',
    'Deep dive into transformer architectures and attention mechanisms',
    'Build 2-3 end-to-end ML projects to demonstrate full-stack ML skills',
  ],
  timelineEstimate: '3-4 months to job-ready',
  marketReadiness: 72,
  hireProbability: 68,
};

export default function AssessmentPage() {
  const [step, setStep] = useState<Step>('role-select');
  const [targetRole, setTargetRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswer, setTextAnswer] = useState('');

  const filteredRoles = popularRoles.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [demoQuestions[currentQ].id]: answer });
    if (currentQ < demoQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
      setTextAnswer('');
    } else {
      setStep('results');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {['role-select', 'profile', 'assessment', 'results'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-neon-blue text-white' :
                ['role-select', 'profile', 'assessment', 'results'].indexOf(step) > i
                  ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-white/30'
              }`}>
                {['role-select', 'profile', 'assessment', 'results'].indexOf(step) > i ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : i + 1}
              </div>
              {i < 3 && <div className={`w-8 sm:w-16 h-px ${['role-select', 'profile', 'assessment', 'results'].indexOf(step) > i ? 'bg-neon-green/30' : 'bg-white/5'}`} />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Role Selection */}
        {step === 'role-select' && (
          <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="text-center mb-8">
              <Brain className="w-12 h-12 text-neon-blue mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">What do you want to become?</h1>
              <p className="text-white/40">This is the starting point of your career transformation.</p>
            </div>

            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search roles or type your own..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {filteredRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => { setTargetRole(role); setStep('profile'); }}
                  className={`card-interactive text-center py-4 ${targetRole === role ? 'border-neon-blue/50 bg-neon-blue/5' : ''}`}
                >
                  <span className="text-sm font-medium">{role}</span>
                </button>
              ))}
            </div>

            {searchQuery && !filteredRoles.length && (
              <div className="text-center mt-6">
                <button
                  onClick={() => { setTargetRole(searchQuery); setStep('profile'); }}
                  className="btn-primary"
                >
                  Continue as &ldquo;{searchQuery}&rdquo; <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Quick Profile */}
        {step === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="text-center mb-8">
              <Target className="w-12 h-12 text-neon-purple mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Quick profile for {targetRole}</h1>
              <p className="text-white/40">Help us personalize your assessment.</p>
            </div>

            <div className="card max-w-lg mx-auto space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Years of experience</label>
                <select className="input-field">
                  <option value="">Select...</option>
                  <option value="0">0 — Career changer</option>
                  <option value="1">1-2 years</option>
                  <option value="3">3-5 years</option>
                  <option value="5">5+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Highest education</label>
                <select className="input-field">
                  <option value="">Select...</option>
                  <option value="hs">High School</option>
                  <option value="bs">Bachelor&apos;s</option>
                  <option value="ms">Master&apos;s</option>
                  <option value="phd">PhD</option>
                  <option value="self">Self-taught</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Skills you already have</label>
                <input className="input-field" placeholder="e.g. Python, SQL, TensorFlow" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('role-select')} className="btn-secondary flex-1 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep('assessment')} className="btn-primary flex-1 flex items-center justify-center gap-1">
                  Start Assessment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Assessment Questions */}
        {step === 'assessment' && (
          <motion.div key="assess" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="badge-neon text-xs">{demoQuestions[currentQ].skill}</span>
                <span className="badge-purple text-xs ml-2">{demoQuestions[currentQ].difficulty}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Clock className="w-4 h-4" />
                <span>Q {currentQ + 1} / {demoQuestions.length}</span>
              </div>
            </div>

            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-6">{demoQuestions[currentQ].question}</h2>

              {demoQuestions[currentQ].type === 'mcq' && demoQuestions[currentQ].options ? (
                <div className="space-y-3">
                  {demoQuestions[currentQ].options!.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all text-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="input-field h-40 resize-none"
                    placeholder="Write your answer here..."
                  />
                  <button
                    onClick={() => handleAnswer(textAnswer)}
                    disabled={!textAnswer.trim()}
                    className="btn-primary"
                  >
                    Submit Answer <ArrowRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="skill-bar h-2">
              <motion.div
                className="skill-bar-fill bg-gradient-to-r from-neon-blue to-neon-purple"
                animate={{ width: `${((currentQ + 1) / demoQuestions.length) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-neon-green" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
              <p className="text-white/40">Here&apos;s your skill analysis for <span className="text-neon-blue">{demoResults.targetRole}</span></p>
            </div>

            {/* Score Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold gradient-text mb-1">{demoResults.overallScore}%</div>
                <div className="text-xs text-white/40">Overall Score</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-neon-green mb-1">{demoResults.marketReadiness}%</div>
                <div className="text-xs text-white/40">Market Readiness</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-neon-purple mb-1">{demoResults.hireProbability}%</div>
                <div className="text-xs text-white/40">Hire Probability</div>
              </div>
            </div>

            {/* Skill Bars */}
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-white/60 mb-6">Skill Breakdown</h3>
              <div className="space-y-4">
                {demoResults.skillScores.map((s) => (
                  <div key={s.skill}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium">{s.skill}</span>
                      <span className="text-xs text-white/40">{s.score}% — {s.level}</span>
                    </div>
                    <div className="skill-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.score}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`skill-bar-fill ${s.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-white/60 mb-4">Key Gaps to Address</h3>
              <div className="space-y-3">
                {demoResults.gaps.map((g) => (
                  <div key={g.skill} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                    <div>
                      <span className="text-sm font-medium">{g.skill}</span>
                      <span className={`badge text-[10px] ml-2 ${g.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {g.priority} priority
                      </span>
                    </div>
                    <div className="text-xs text-white/40">{g.current}% → {g.required}% needed</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="card mb-8">
              <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> AI Recommendations
              </h3>
              <div className="space-y-3">
                {demoResults.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                    <Zap className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/10">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-neon-blue" />
                  <span className="text-neon-blue font-medium">Estimated timeline: {demoResults.timelineEstimate}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/career-plan" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
                Generate Career Plan <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={() => { setStep('role-select'); setCurrentQ(0); setAnswers({}); }} className="btn-secondary flex-1">
                Retake Assessment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
