'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Mic, Clock, Target, Trophy, Brain, Sparkles,
  ArrowRight, ArrowLeft, Play, CheckCircle2, AlertCircle,
  Loader2, RotateCcw, ChevronDown, ChevronUp, Lightbulb,
  BarChart3, Star, Zap, MessageSquare, Send, Timer, Users
} from 'lucide-react';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { notifyAgentCompleted } from '@/lib/notifications/toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface Question {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  hints: string[];
  keyPoints: string[];
}

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
}

interface QuestionResult {
  question: Question;
  answer: string;
  evaluation: Evaluation;
  timeSpent: number;
}

type Phase = 'setup' | 'practice' | 'evaluating' | 'review' | 'results';

const typeBadgeColors: Record<string, string> = {
  behavioral: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  technical: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  situational: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

function LoadingSkeleton() {
  return <AgentLoader agentId="atlas" message="Agent Atlas is preparing your session" />;
}

export default function InterviewPrepPage() {
  const { data: session } = useSession();
  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase() as PlanTier;
  const atlasLocked = !isAgentAvailable('atlas', userPlan);
  const isPro = userPlan === 'PRO';
  const isUltra = userPlan === 'ULTRA';
  const hasExpertAccess = isPro || isUltra;

  // Setup state
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [showJdInput, setShowJdInput] = useState(false);
  const [expertRequested, setExpertRequested] = useState(false);
  const [expertLoading, setExpertLoading] = useState(false);

  // Practice state
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Results state
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number>(0);

  // Auto-generate questions if targetRole is pre-filled
  const autoGenTriggered = useRef(false);
  useEffect(() => {
    if (targetRole && !autoGenTriggered.current && phase === 'setup' && questions.length === 0) {
      autoGenTriggered.current = true;
      // Small delay so the UI renders first
      setTimeout(() => {
        handleGenerate();
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRole]);

  // Timer logic
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      // Auto-submit when time runs out
      if (answer.trim()) {
        handleSubmitAnswer();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft]);

  // Auto-fill targetRole from localStorage on mount
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('3box_target_role');
      if (savedRole) {
        setTargetRole(savedRole);
      }
    } catch {}
  }, []);

  // Handle expert request
  const handleRequestExpert = async () => {
    setExpertLoading(true);
    try {
      const res = await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mock_interview',
          targetRole,
          message: `Request for mock interview session with a human expert for the role: ${targetRole || 'General'}`,
        }),
      });
      if (res.ok) {
        setExpertRequested(true);
      }
    } catch {
      // Still show as requested for UX
      setExpertRequested(true);
    } finally {
      setExpertLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Generate questions
  const handleGenerate = async () => {
    if (!targetRole.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          targetRole,
          jobDescription: jobDescription || undefined,
          questionsCount: questionCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setCurrentIndex(0);
          setResults([]);
          setPhase('practice');
          setTimeLeft(data.questions[0].timeLimit || 120);
          setTimerActive(true);
          startTimeRef.current = Date.now();
          setTimeout(() => textareaRef.current?.focus(), 100);
          notifyAgentCompleted('atlas', `Atlas prepared ${data.questions.length} interview questions`, '/dashboard/interview');
        }
      } else {
        setGenError('Failed to generate questions. Please try again.');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      setGenError('Network error. Please check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Submit answer for evaluation
  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim() || evaluating) return;
    setTimerActive(false);
    setEvaluating(true);
    setPhase('evaluating');

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const currentQuestion = questions[currentIndex];

    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          targetRole,
          question: currentQuestion.question,
          answer: answer.trim(),
        }),
      });

      if (res.ok) {
        const evaluation: Evaluation = await res.json();
        setCurrentEvaluation(evaluation);

        const result: QuestionResult = {
          question: currentQuestion,
          answer: answer.trim(),
          evaluation,
          timeSpent,
        };
        setResults(prev => [...prev, result]);
        setPhase('review');
      }
    } catch (err) {
      console.error('Error evaluating answer:', err);
      // Fallback evaluation
      const fallbackEval: Evaluation = {
        score: 5,
        feedback: 'Unable to evaluate at this time. Please try again.',
        strengths: ['Attempted the question'],
        improvements: ['Try again for a detailed evaluation'],
        improvedAnswer: 'Please retry for an AI-powered evaluation.',
      };
      setCurrentEvaluation(fallbackEval);
      setResults(prev => [...prev, {
        question: currentQuestion,
        answer: answer.trim(),
        evaluation: fallbackEval,
        timeSpent,
      }]);
      setPhase('review');
    } finally {
      setEvaluating(false);
    }
  }, [answer, evaluating, questions, currentIndex, targetRole]);

  // Move to next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setAnswer('');
      setCurrentEvaluation(null);
      setShowHints(false);
      setPhase('practice');
      setTimeLeft(questions[nextIndex].timeLimit || 120);
      setTimerActive(true);
      startTimeRef.current = Date.now();
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setPhase('results');
    }
  };

  // Restart
  const handleRestart = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    setResults([]);
    setCurrentEvaluation(null);
    setShowHints(false);
    setTimerActive(false);
  };

  // Calculate results summary
  const avgScore = results.length > 0
    ? (results.reduce((sum, r) => sum + r.evaluation.score, 0) / results.length).toFixed(1)
    : '0';
  const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
  const highScore = results.length > 0
    ? Math.max(...results.map(r => r.evaluation.score))
    : 0;
  const allStrengths = [...new Set(results.flatMap(r => r.evaluation.strengths))];
  const allImprovements = [...new Set(results.flatMap(r => r.evaluation.improvements))];

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((results.length) / questions.length) * 100 : 0;

  if (atlasLocked) return <AgentLockedPage agentId="atlas" />;

  return (
    <div className="max-w-4xl mx-auto">
      <AgentPageHeader agentId="atlas" />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Mic className="w-7 h-7 text-rose-400" /> Interview Prep
        </h1>
        <p className="text-white/40">Practice with AI-generated questions and get real-time feedback on your answers.</p>
      </motion.div>

      {/* Human Expert Banner */}
      <div className="card bg-gradient-to-r from-purple-400/10 to-violet-400/10 border-purple-400/20 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-400/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Practice with Real Industry Experts</h3>
          <p className="text-xs text-white/40">
            {hasExpertAccess
              ? 'Get personalized mock interview sessions with experts from top companies (limited sessions)'
              : 'Pro & Ultra plans include mock interviews with human experts from top companies'}
          </p>
        </div>
        {hasExpertAccess ? (
          expertRequested ? (
            <span className="text-xs text-purple-400 flex items-center gap-1 flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Request Sent
            </span>
          ) : (
            <button
              onClick={handleRequestExpert}
              disabled={expertLoading}
              className="btn-primary text-xs px-3 py-1.5 flex-shrink-0 flex items-center gap-1"
            >
              {expertLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
              Request Expert
            </button>
          )
        ) : (
          <Link href="/pricing" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
            Upgrade
          </Link>
        )}
      </div>

      {/* ============ SETUP PHASE ============ */}
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Role Selection */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" /> Setup Your Practice Session
              </h2>

              <div className="space-y-4">
                {/* Target Role */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Target Role *</label>
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Frontend Engineer, Data Scientist, Product Manager..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Job Description (Optional) - paste JD or paste JD link */}
                <div>
                  <button
                    onClick={() => setShowJdInput(!showJdInput)}
                    className="text-sm text-purple-400 flex items-center gap-1 hover:underline"
                  >
                    {showJdInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showJdInput ? 'Hide' : 'Add'} Job Description or JD Link (optional)
                  </button>
                  <AnimatePresence>
                    {showJdInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-2"
                      >
                        <textarea
                          value={jobDescription}
                          onChange={e => setJobDescription(e.target.value)}
                          placeholder="Paste the job description here OR paste a job posting URL for more targeted questions..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors h-32 resize-none"
                        />
                        <p className="text-[11px] text-white/30">
                          Tip: Paste the full job description for best results. You can also paste a job posting URL.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Question Count */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Number of Questions</label>
                  <div className="flex items-center gap-3">
                    {[3, 5, 8, 10].map(count => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          questionCount === count
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {genError && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{genError}</span>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={() => { setGenError(null); handleGenerate(); }}
                  disabled={!targetRole.trim() || generating}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Interview Questions
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips Card */}
            <div className="card border border-white/5">
              <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Interview Tips
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <div className="text-xs font-medium text-blue-400 mb-1">Behavioral</div>
                  <p className="text-xs text-white/40">Use the STAR method: Situation, Task, Action, Result. Be specific with examples.</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <div className="text-xs font-medium text-purple-400 mb-1">Technical</div>
                  <p className="text-xs text-white/40">Think aloud, discuss trade-offs, and explain your reasoning before diving into details.</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <div className="text-xs font-medium text-orange-400 mb-1">Situational</div>
                  <p className="text-xs text-white/40">Show problem-solving skills and leadership. Focus on what you would do and why.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ PRACTICE PHASE ============ */}
        {(phase === 'practice' || phase === 'evaluating') && currentQuestion && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 skill-bar h-2">
                <motion.div
                  className="skill-bar-fill bg-gradient-to-r from-purple-500 to-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-white/40 flex-shrink-0">
                {results.length}/{questions.length}
              </span>
            </div>

            {/* Question Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">Q{currentIndex + 1}/{questions.length}</span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border ${typeBadgeColors[currentQuestion.type]}`}>
                    {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)}
                  </span>
                  <span className={`text-[10px] ${difficultyColors[currentQuestion.difficulty]}`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                {/* Timer */}
                <div className={`flex items-center gap-1.5 text-sm font-mono ${
                  timeLeft <= 30 ? 'text-red-400' : timeLeft <= 60 ? 'text-yellow-400' : 'text-white/60'
                }`}>
                  <Timer className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
              </div>

              <h3 className="text-lg font-medium mb-6 leading-relaxed">{currentQuestion.question}</h3>

              {/* Key Points */}
              {currentQuestion.keyPoints && currentQuestion.keyPoints.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="text-xs text-white/40 mb-2">Key points to cover:</div>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.keyPoints.map((point, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400/70">{point}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hints Toggle */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-xs text-yellow-400/70 hover:text-yellow-400 flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    {showHints ? 'Hide hints' : 'Show hints'}
                  </button>
                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1"
                      >
                        {currentQuestion.hints.map((hint, i) => (
                          <div key={i} className="text-xs text-yellow-400/50 flex items-start gap-1.5">
                            <span className="mt-0.5">-</span> {hint}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Answer Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here... Be specific, use examples, and structure your response clearly."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors h-40 resize-none"
                  disabled={phase === 'evaluating'}
                />
                <div className="absolute bottom-3 right-3 text-xs text-white/20">
                  {answer.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleRestart}
                  className="btn-ghost text-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Start Over
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || phase === 'evaluating'}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phase === 'evaluating' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ REVIEW PHASE ============ */}
        {phase === 'review' && currentEvaluation && currentQuestion && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 skill-bar h-2">
                <motion.div
                  className="skill-bar-fill bg-gradient-to-r from-purple-500 to-violet-500"
                  animate={{ width: `${((results.length) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-white/40 flex-shrink-0">
                {results.length}/{questions.length}
              </span>
            </div>

            {/* Score Card */}
            <div className="card text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-full border ${typeBadgeColors[currentQuestion.type]}`}>
                  {currentQuestion.type}
                </span>
              </div>
              <div className={`text-5xl font-bold mb-1 ${
                currentEvaluation.score >= 8 ? 'text-purple-400' :
                currentEvaluation.score >= 5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {currentEvaluation.score}/10
              </div>
              <p className="text-sm text-white/40">Question Score</p>
            </div>

            {/* Feedback */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> Feedback
              </h3>
              <p className="text-sm text-white/70 mb-4">{currentEvaluation.feedback}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-3 rounded-lg bg-purple-400/5 border border-purple-400/10">
                  <div className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Strengths
                  </div>
                  <ul className="space-y-1">
                    {currentEvaluation.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                        <span className="text-purple-400 mt-0.5">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <div className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Areas to Improve
                  </div>
                  <ul className="space-y-1">
                    {currentEvaluation.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                        <span className="text-yellow-400 mt-0.5">-</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Improved Answer */}
            <div className="card border border-purple-400/20 bg-gradient-to-r from-purple-500/5 to-violet-500/5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Model Answer
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">{currentEvaluation.improvedAnswer}</p>
            </div>

            {/* Next Button */}
            <div className="flex items-center justify-between">
              <button onClick={handleRestart} className="btn-ghost text-sm flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Start Over
              </button>
              <button onClick={handleNext} className="btn-primary text-sm flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <>Next Question <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>View Results <Trophy className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ============ RESULTS PHASE ============ */}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Performance */}
            <div className="card text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-1">Practice Complete!</h2>
              <p className="text-sm text-white/40 mb-6">Here&apos;s how you performed for {targetRole}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className={`text-3xl font-bold ${
                    Number(avgScore) >= 7 ? 'text-purple-400' :
                    Number(avgScore) >= 5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{avgScore}</div>
                  <div className="text-xs text-white/40">Avg Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400">{results.length}</div>
                  <div className="text-xs text-white/40">Questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400">{highScore}/10</div>
                  <div className="text-xs text-white/40">Best Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white/60">{formatTime(totalTime)}</div>
                  <div className="text-xs text-white/40">Total Time</div>
                </div>
              </div>

              {/* Score visualization */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      r.evaluation.score >= 8 ? 'bg-purple-400/20 text-purple-400' :
                      r.evaluation.score >= 5 ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-red-400/20 text-red-400'
                    }`}
                  >
                    {r.evaluation.score}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/30">Score per question</p>
            </div>

            {/* Strengths & Improvements Summary */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Overall Strengths
                </h3>
                <ul className="space-y-2">
                  {allStrengths.slice(0, 5).map((s, i) => (
                    <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                      <Star className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {allImprovements.slice(0, 5).map((s, i) => (
                    <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                      <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Question-by-Question Breakdown */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Question Breakdown
              </h3>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <details key={i} className="group">
                    <summary className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        r.evaluation.score >= 8 ? 'bg-purple-400/20 text-purple-400' :
                        r.evaluation.score >= 5 ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {r.evaluation.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.question.question}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${typeBadgeColors[r.question.type]}`}>
                            {r.question.type}
                          </span>
                          <span className="text-[10px] text-white/30">{formatTime(r.timeSpent)}</span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-3 pb-3 mt-2 space-y-3">
                      <div>
                        <div className="text-xs text-white/40 mb-1">Your Answer:</div>
                        <p className="text-xs text-white/60 p-2 rounded bg-white/[0.02]">{r.answer}</p>
                      </div>
                      <div>
                        <div className="text-xs text-white/40 mb-1">Feedback:</div>
                        <p className="text-xs text-white/60">{r.evaluation.feedback}</p>
                      </div>
                      <div>
                        <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Model Answer:
                        </div>
                        <p className="text-xs text-white/50 p-2 rounded bg-purple-400/5 border border-purple-400/10">
                          {r.evaluation.improvedAnswer}
                        </p>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="btn-ghost text-sm flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Dashboard
              </Link>
              <button onClick={handleRestart} className="btn-primary text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Practice Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
