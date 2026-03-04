'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Brain, Rocket, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';

const suggestedRoles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'Marketing Manager',
  'Business Analyst',
  'Full Stack Developer',
];

const interestOptions = [
  'AI & Machine Learning',
  'Web Development',
  'Mobile Apps',
  'Data Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'Product Design',
  'Digital Marketing',
  'Blockchain',
  'DevOps',
  'Game Development',
  'Startup',
  'Leadership',
  'Remote Work',
  'Freelancing',
];

const nextStepCards = [
  {
    icon: Brain,
    title: 'Skill Assessment',
    description: 'AI analyzes your skills and finds gaps',
    gradient: 'from-neon-blue to-cyan-400',
  },
  {
    icon: Target,
    title: 'Career Roadmap',
    description: 'Personalized plan with milestones',
    gradient: 'from-neon-purple to-pink-400',
  },
  {
    icon: Rocket,
    title: 'Job Matching',
    description: 'AI matches you with relevant opportunities',
    gradient: 'from-neon-green to-emerald-400',
  },
];

const stepIcons = [Target, Brain, Rocket];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 3;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, interests }),
      });

      if (!res.ok) {
        throw new Error('Failed to save onboarding data');
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

      <div className="relative w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: step === i ? 1.1 : 1,
                        boxShadow:
                          step === i
                            ? '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.15)'
                            : '0 0 0px transparent',
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        step > i
                          ? 'bg-neon-green/20 border-2 border-neon-green'
                          : step === i
                          ? 'bg-neon-blue/20 border-2 border-neon-blue'
                          : 'bg-white/5 border-2 border-white/10'
                      }`}
                    >
                      {step > i ? (
                        <Check className="w-4 h-4 text-neon-green" />
                      ) : (
                        <Icon
                          className={`w-4 h-4 ${
                            step === i ? 'text-neon-blue' : 'text-white/30'
                          }`}
                        />
                      )}
                    </motion.div>
                    <span
                      className={`text-[10px] mt-1.5 font-medium ${
                        step >= i ? 'text-white/60' : 'text-white/20'
                      }`}
                    >
                      Step {i + 1}
                    </span>
                  </div>
                  {i < totalSteps - 1 && (
                    <div className="flex-1 h-px mx-3 mb-5">
                      <div className="h-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: step > i ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card container */}
        <div className="glass p-8 min-h-[460px] relative overflow-hidden">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Career Goal */}
            {step === 0 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center mx-auto mb-4"
                  >
                    <Target className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">
                    Let&apos;s start with your <span className="gradient-text">goal</span>
                  </h2>
                  <p className="text-white/40 text-sm">What role are you targeting?</p>
                </div>

                <div className="mb-6">
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer, Product Manager"
                    className="input-field text-center"
                  />
                </div>

                <div className="mb-8">
                  <p className="text-xs text-white/30 text-center mb-3">Or pick one</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => setTargetRole(role)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          targetRole === role
                            ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue'
                            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={goNext}
                  disabled={!targetRole.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Interests */}
            {step === 1 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center mx-auto mb-4"
                  >
                    <Brain className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">
                    What <span className="gradient-text">excites</span> you?
                  </h2>
                  <p className="text-white/40 text-sm">
                    Select areas that interest you{' '}
                    <span className="text-white/20">(at least 2)</span>
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {interestOptions.map((interest, i) => {
                    const isSelected = interests.includes(interest);
                    return (
                      <motion.button
                        key={interest}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-neon-blue/20 border border-neon-blue text-neon-blue shadow-[0_0_12px_rgba(0,212,255,0.2)]'
                            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        {interest}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="btn-secondary flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={interests.length < 2}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: All Set */}
            {step === 2 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center mx-auto mb-4"
                  >
                    <Sparkles className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">
                    Your AI career engine is{' '}
                    <span className="gradient-text">ready</span>
                  </h2>
                  <p className="text-white/40 text-sm">Here&apos;s what happens next</p>
                </div>

                <div className="grid gap-4 mb-8">
                  {nextStepCards.map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="card flex items-center gap-4"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center flex-shrink-0`}
                      >
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{card.title}</h3>
                        <p className="text-xs text-white/40">{card.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="btn-secondary flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-lg py-4"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" /> Launch My Career
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
