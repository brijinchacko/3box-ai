'use client';

import { create } from 'zustand';
import type {
  UserProfile,
  PlanTier,
  ChatMessage,
  CoachConfig,
  AssessmentResult,
  CareerTwinData,
  SubscriptionData,
  ReferralData,
} from '@/types';
import { normalizePlan } from '@/lib/tokens/pricing';

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  effectivePlan: () => PlanTier;

  // Subscription
  subscription: SubscriptionData | null;
  setSubscription: (sub: SubscriptionData | null) => void;

  // Referral
  referralData: ReferralData | null;
  setReferralData: (data: ReferralData | null) => void;

  // Onboarding
  onboardingDone: boolean;
  setOnboardingDone: (done: boolean) => void;

  // AI Coach
  coachConfig: CoachConfig;
  setCoachConfig: (config: Partial<CoachConfig>) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  coachOpen: boolean;
  setCoachOpen: (open: boolean) => void;

  // Assessment
  currentAssessment: AssessmentResult | null;
  setCurrentAssessment: (result: AssessmentResult | null) => void;

  // Career Twin
  careerTwin: CareerTwinData | null;
  setCareerTwin: (data: CareerTwinData | null) => void;

  // Visitor personalization
  visitorName: string | null;
  setVisitorName: (name: string | null) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),
  effectivePlan: () => {
    const user = get().user;
    if (!user) return 'FREE';
    if (user.isOforoInternal) return 'MAX';
    const sub = get().subscription;
    if (sub && sub.status === 'active') return normalizePlan(sub.plan);
    return normalizePlan(user.plan);
  },

  // Subscription
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),

  // Referral
  referralData: null,
  setReferralData: (referralData) => set({ referralData }),

  // Onboarding
  onboardingDone: false,
  setOnboardingDone: (onboardingDone) => set({ onboardingDone }),

  // AI Coach
  coachConfig: {
    name: 'Cortex',
    personality: 'friendly',
    enabled: true,
  },
  setCoachConfig: (config) => set((s) => ({ coachConfig: { ...s.coachConfig, ...config } })),
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),
  coachOpen: false,
  setCoachOpen: (open) => set({ coachOpen: open }),

  // Assessment
  currentAssessment: null,
  setCurrentAssessment: (result) => set({ currentAssessment: result }),

  // Career Twin
  careerTwin: null,
  setCareerTwin: (data) => set({ careerTwin: data }),

  // Visitor personalization
  visitorName: null,
  setVisitorName: (name) => {
    if (name) {
      localStorage.setItem('3box_visitor_name', name);
    } else {
      localStorage.removeItem('3box_visitor_name');
    }
    set({ visitorName: name });
  },

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
