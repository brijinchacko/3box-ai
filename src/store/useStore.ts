'use client';

import { create } from 'zustand';
import type { UserProfile, PlanTier, ChatMessage, CoachConfig, AssessmentResult, CareerTwinData } from '@/types';

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  effectivePlan: () => PlanTier;

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
    if (!user) return 'BASIC';
    if (user.isOforoInternal) return 'ULTRA';
    return user.plan;
  },

  // AI Coach
  coachConfig: {
    name: 'Nova',
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

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
