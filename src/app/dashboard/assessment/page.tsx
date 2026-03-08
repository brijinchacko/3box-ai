'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, ArrowRight, ArrowLeft, Clock, CheckCircle2,
  BarChart3, Target, Lightbulb, Zap, Star, TrendingUp, Loader2, Lock
} from 'lucide-react';
import AgentLoader from '@/components/brand/AgentLoader';

type Step = 'role-select' | 'profile' | 'generating' | 'assessment' | 'evaluating' | 'results';

const popularRoles = [
  'AI Engineer', 'Data Scientist', 'Full Stack Developer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer', 'Cloud Architect',
  'Cybersecurity Analyst', 'PLC Programmer', 'Mobile Developer', 'Blockchain Developer',
];

// Fallback questions if AI generation fails
const fallbackQuestions = [
  { id: 'f1', type: 'mcq' as const, skill: 'Programming Fundamentals', question: 'Which data structure uses LIFO (Last In, First Out) ordering?', options: ['Queue', 'Stack', 'Linked List', 'Hash Table'], difficulty: 'beginner' as const, timeLimit: 60 },
  { id: 'f2', type: 'mcq' as const, skill: 'Problem Solving', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], difficulty: 'beginner' as const, timeLimit: 60 },
  { id: 'f3', type: 'mcq' as const, skill: 'Version Control', question: 'Which Git command creates a new branch?', options: ['git new', 'git branch', 'git create', 'git init'], difficulty: 'beginner' as const, timeLimit: 45 },
  { id: 'f4', type: 'mcq' as const, skill: 'Databases', question: 'Which SQL clause is used to filter records?', options: ['SELECT', 'WHERE', 'ORDER BY', 'GROUP BY'], difficulty: 'beginner' as const, timeLimit: 45 },
  { id: 'f5', type: 'mcq' as const, skill: 'Software Design', question: 'What does the SOLID "S" principle stand for?', options: ['Single Responsibility', 'Secure Design', 'Service Oriented', 'Stateless Architecture'], difficulty: 'intermediate' as const, timeLimit: 60 },
  { id: 'f6', type: 'mcq' as const, skill: 'APIs', question: 'Which HTTP method is used to update a resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], difficulty: 'beginner' as const, timeLimit: 45 },
  { id: 'f7', type: 'mcq' as const, skill: 'Testing', question: 'What is the purpose of unit testing?', options: ['Test UI appearance', 'Test individual functions in isolation', 'Test network latency', 'Test user experience'], difficulty: 'beginner' as const, timeLimit: 45 },
  { id: 'f8', type: 'scenario' as const, skill: 'System Design', question: 'Describe how you would design a URL shortener service that handles millions of requests per day. Consider storage, scaling, and redirect latency.', difficulty: 'advanced' as const, timeLimit: 180 },
  { id: 'f9', type: 'mcq' as const, skill: 'Security', question: 'What is SQL injection?', options: ['A database optimization', 'A code injection attack via SQL queries', 'A type of database index', 'A SQL performance tool'], difficulty: 'intermediate' as const, timeLimit: 60 },
  { id: 'f10', type: 'scenario' as const, skill: 'Problem Solving', question: 'You discover a critical bug in production at 2 AM. The bug affects 10% of users. Walk through your approach to diagnose, fix, and prevent this in the future.', difficulty: 'advanced' as const, timeLimit: 180 },
];

interface Question {
  id: string;
  type: 'mcq' | 'scenario' | 'task';
  skill: string;
  question: string;
  options?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit: number;
}

interface SkillScore {
  skill: string;
  score: number;
  level: string;
  color: string;
}

interface Gap {
  skill: string;
  current: number;
  required: number;
  priority: 'high' | 'medium' | 'low';
}

interface AssessmentResults {
  targetRole: string;
  overallScore: number;
  skillScores: SkillScore[];
  gaps: Gap[];
  recommendations: string[];
  timelineEstimate: string;
  marketReadiness: number;
  hireProbability: number;
}

const defaultResults: AssessmentResults = {
  targetRole: 'General',
  overallScore: 68,
  skillScores: [
    { skill: 'Programming', score: 75, level: 'Intermediate', color: 'bg-neon-green' },
    { skill: 'Problem Solving', score: 70, level: 'Intermediate', color: 'bg-neon-blue' },
    { skill: 'System Design', score: 55, level: 'Beginner', color: 'bg-neon-purple' },
    { skill: 'Databases', score: 65, level: 'Intermediate', color: 'bg-cyan-400' },
  ],
  gaps: [
    { skill: 'System Design', current: 55, required: 80, priority: 'high' },
    { skill: 'Advanced Concepts', current: 50, required: 75, priority: 'medium' },
  ],
  recommendations: [
    'Focus on system design fundamentals and practice with real-world scenarios',
    'Build end-to-end projects to solidify your skills',
    'Study advanced topics specific to your target role',
  ],
  timelineEstimate: '3-6 months to job-ready',
  marketReadiness: 60,
  hireProbability: 55,
};

const skillColors = [
  'bg-neon-green', 'bg-neon-blue', 'bg-neon-purple',
  'bg-cyan-400', 'bg-yellow-400', 'bg-pink-400',
  'bg-orange-400', 'bg-emerald-400',
];

export default function AssessmentPage() {
  const [step, setStep] = useState<Step>('role-select');
  const [targetRole, setTargetRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswer, setTextAnswer] = useState('');

  // AI-generated questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatingProgress, setGeneratingProgress] = useState(0);

  // Profile state
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [existingSkills, setExistingSkills] = useState('');

  // Results state
  const [results, setResults] = useState<AssessmentResults>(defaultResults);

  const filteredRoles = popularRoles.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectRole = (role: string) => {
    setTargetRole(role);
    localStorage.setItem('jobted_target_role', role);
    setStep('profile');
  };

  // Generate AI questions
  const startAssessment = async () => {
    setStep('generating');
    setGeneratingProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGeneratingProgress((prev) => Math.min(prev + 2, 90));
    }, 500);

    try {
      const res = await fetch('/api/ai/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          targetRole,
          existingSkills: existingSkills ? existingSkills.split(',').map(s => s.trim()) : [],
        }),
      });

      clearInterval(progressInterval);

      if (res.ok) {
        const data = await res.json();
        let aiQuestions: Question[] = [];

        // Parse the AI response
        try {
          const text = data.response || data.questions || '';
          const jsonStr = typeof text === 'string' ? text : JSON.stringify(text);
          const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length >= 5) {
              aiQuestions = parsed.map((q: any, i: number) => ({
                id: q.id || `q${i + 1}`,
                type: q.type || 'mcq',
                skill: q.skill || 'General',
                question: q.question || '',
                options: q.options || undefined,
                difficulty: q.difficulty || 'intermediate',
                timeLimit: q.timeLimit || 60,
              })).filter((q: Question) => q.question);
            }
          }
        } catch (parseErr) {
          console.error('Failed to parse AI questions:', parseErr);
        }

        if (aiQuestions.length >= 5) {
          setQuestions(aiQuestions);
          setGeneratingProgress(100);
          setTimeout(() => setStep('assessment'), 500);
          return;
        }
      }
    } catch (err) {
      console.error('AI question generation failed:', err);
      clearInterval(progressInterval);
    }

    // Fallback to predefined questions
    setQuestions(fallbackQuestions);
    setGeneratingProgress(100);
    setTimeout(() => setStep('assessment'), 500);
  };

  const handleAnswer = (answer: string) => {
    const updatedAnswers = { ...answers, [questions[currentQ].id]: answer };
    setAnswers(updatedAnswers);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setTextAnswer('');
    } else {
      evaluateAssessment(updatedAnswers);
    }
  };

  const evaluateAssessment = async (allAnswers: Record<string, string>) => {
    setStep('evaluating');

    try {
      const questionsWithAnswers = questions.map(q => ({
        skill: q.skill,
        difficulty: q.difficulty,
        question: q.question,
        type: q.type,
        answer: allAnswers[q.id] || 'No answer provided',
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a career assessment evaluator. Evaluate this candidate for the role of "${targetRole}".

Profile: ${experience ? `${experience} years experience` : 'Not specified'}, ${education || 'Not specified'} education, Skills: ${existingSkills || 'Not specified'}.

Assessment answers (${questions.length} questions):
${questionsWithAnswers.map((qa, i) => `Q${i + 1} (${qa.skill}, ${qa.difficulty}, ${qa.type}): ${qa.question}\nAnswer: ${qa.answer}`).join('\n\n')}

Generate a JSON assessment result with this exact structure:
{
  "overallScore": <number 0-100>,
  "skillScores": [{"skill": "<name>", "score": <0-100>, "level": "Beginner|Intermediate|Advanced"}],
  "gaps": [{"skill": "<name>", "current": <0-100>, "required": <0-100>, "priority": "high|medium|low"}],
  "recommendations": ["<string>", ...],
  "timelineEstimate": "<string>",
  "marketReadiness": <0-100>,
  "hireProbability": <0-100>
}

Include 5-8 skill scores relevant to ${targetRole}. Include 2-4 gaps. Include 3-5 recommendations. Be realistic based on the answers given. Score fairly — wrong answers should reduce scores significantly. Return ONLY the JSON object.`,
          context: { targetRole },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data.response || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const aiResults: AssessmentResults = {
            targetRole,
            overallScore: parsed.overallScore || 65,
            skillScores: (parsed.skillScores || []).map((s: any, i: number) => ({
              skill: s.skill,
              score: s.score,
              level: s.level || 'Intermediate',
              color: skillColors[i % skillColors.length],
            })),
            gaps: (parsed.gaps || []).map((g: any) => ({
              skill: g.skill,
              current: g.current,
              required: g.required,
              priority: g.priority || 'medium',
            })),
            recommendations: parsed.recommendations || defaultResults.recommendations,
            timelineEstimate: parsed.timelineEstimate || '3-6 months',
            marketReadiness: parsed.marketReadiness || 60,
            hireProbability: parsed.hireProbability || 55,
          };

          // Save to localStorage
          const scoreMap: Record<string, number> = {};
          aiResults.skillScores.forEach(s => { scoreMap[s.skill] = s.score; });
          localStorage.setItem('jobted_skill_scores', JSON.stringify(scoreMap));

          // Save to database
          try {
            await fetch('/api/user/assessment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetRole,
                questions,
                answers: allAnswers,
                skillScores: aiResults.skillScores,
                overallScore: aiResults.overallScore,
                marketReadiness: aiResults.marketReadiness,
                hireProbability: aiResults.hireProbability,
                aiAnalysis: {
                  gaps: aiResults.gaps,
                  recommendations: aiResults.recommendations,
                  timelineEstimate: aiResults.timelineEstimate,
                },
              }),
            });
          } catch (saveErr) {
            console.error('Failed to save assessment:', saveErr);
          }

          setResults(aiResults);
          setStep('results');
          return;
        }
      }
    } catch (err) {
      console.error('Assessment evaluation failed:', err);
    }

    // Fallback
    const fallback = { ...defaultResults, targetRole };
    const scoreMap: Record<string, number> = {};
    fallback.skillScores.forEach(s => { scoreMap[s.skill] = s.score; });
    localStorage.setItem('jobted_skill_scores', JSON.stringify(scoreMap));
    setResults(fallback);
    setStep('results');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {(['role-select', 'profile', 'assessment', 'results'] as const).map((s, i) => {
            const steps: Step[] = ['role-select', 'profile', 'assessment', 'results'];
            const currentIdx = steps.indexOf(
              step === 'evaluating' ? 'results' : step === 'generating' ? 'assessment' : step
            );
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s || (step === 'evaluating' && s === 'results') || (step === 'generating' && s === 'assessment')
                    ? 'bg-neon-blue text-white'
                    : currentIdx > i ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-white/30'
                }`}>
                  {currentIdx > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < 3 && <div className={`w-8 sm:w-16 h-px ${currentIdx > i ? 'bg-neon-green/30' : 'bg-white/5'}`} />}
              </div>
            );
          })}
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
                  onClick={() => selectRole(role)}
                  className={`card-interactive text-center py-4 ${targetRole === role ? 'border-neon-blue/50 bg-neon-blue/5' : ''}`}
                >
                  <span className="text-sm font-medium">{role}</span>
                </button>
              ))}
            </div>

            {searchQuery && !filteredRoles.length && (
              <div className="text-center mt-6">
                <button onClick={() => selectRole(searchQuery)} className="btn-primary">
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
                <select className="input-field" value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="0">0 — Career changer</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Highest education</label>
                <select className="input-field" value={education} onChange={(e) => setEducation(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="High School">High School</option>
                  <option value="Bachelor's">Bachelor&apos;s</option>
                  <option value="Master's">Master&apos;s</option>
                  <option value="PhD">PhD</option>
                  <option value="Self-taught">Self-taught</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Skills you already have</label>
                <input
                  className="input-field"
                  placeholder="e.g. Python, SQL, TensorFlow"
                  value={existingSkills}
                  onChange={(e) => setExistingSkills(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('role-select')} className="btn-secondary flex-1 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={startAssessment} className="btn-primary flex-1 flex items-center justify-center gap-1">
                  Start Assessment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2.5: Generating Questions */}
        {step === 'generating' && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <AgentLoader agentId="cortex" message={`Cortex is creating your assessment for ${targetRole}`} />
            <div className="max-w-xs mx-auto mt-4">
              <div className="skill-bar h-2 mb-2">
                <motion.div
                  className="skill-bar-fill bg-gradient-to-r from-neon-blue to-neon-purple"
                  animate={{ width: `${generatingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-white/30">{generatingProgress}%</span>
            </div>
          </motion.div>
        )}

        {/* Step 3: Assessment Questions */}
        {step === 'assessment' && questions.length > 0 && (
          <motion.div key="assess" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="badge-neon text-xs">{questions[currentQ].skill}</span>
                <span className="badge-purple text-xs ml-2">{questions[currentQ].difficulty}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Clock className="w-4 h-4" />
                <span>Q {currentQ + 1} / {questions.length}</span>
              </div>
            </div>

            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-6">{questions[currentQ].question}</h2>

              {questions[currentQ].type === 'mcq' && questions[currentQ].options ? (
                <div className="space-y-3">
                  {questions[currentQ].options!.map((opt) => (
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
                animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Step 3.5: Evaluating */}
        {step === 'evaluating' && (
          <motion.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
            <AgentLoader agentId="cortex" message={`Cortex is analyzing your ${questions.length} responses`} size="lg" />
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
              <p className="text-white/40">Here&apos;s your skill analysis for <span className="text-neon-blue">{results.targetRole}</span></p>
            </div>

            {/* Job Unlock Status */}
            {results.overallScore >= 85 ? (
              <div className="card border-neon-green/30 bg-neon-green/5 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-neon-green flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-neon-green">Jobs Unlocked!</h3>
                    <p className="text-sm text-white/50">
                      Your score of {results.overallScore}% meets the 85% threshold. You can now access job applications.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/jobs" className="btn-primary mt-4 inline-flex items-center gap-2">
                  Browse Jobs <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="card border-yellow-500/30 bg-yellow-500/5 mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-yellow-400">Score: {results.overallScore}% — Need 85% to unlock jobs</h3>
                    <p className="text-sm text-white/50">
                      Complete the learning path to improve your skills, then re-take the assessment.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/learning" className="btn-primary mt-4 inline-flex items-center gap-2">
                  Start Learning Path <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Score Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold gradient-text mb-1">{results.overallScore}%</div>
                <div className="text-xs text-white/40">Overall Score</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-neon-green mb-1">{results.marketReadiness}%</div>
                <div className="text-xs text-white/40">Market Readiness</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-neon-purple mb-1">{results.hireProbability}%</div>
                <div className="text-xs text-white/40">Hire Probability</div>
              </div>
            </div>

            {/* Skill Bars */}
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-white/60 mb-6">Skill Breakdown</h3>
              <div className="space-y-4">
                {results.skillScores.map((s) => (
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
                {results.gaps.map((g) => (
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
                {results.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                    <Zap className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/10">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-neon-blue" />
                  <span className="text-neon-blue font-medium">Estimated timeline: {results.timelineEstimate}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/career-plan" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
                Generate Career Plan <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={() => { setStep('role-select'); setCurrentQ(0); setAnswers({}); setTextAnswer(''); setQuestions([]); }} className="btn-secondary flex-1">
                Retake Assessment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
