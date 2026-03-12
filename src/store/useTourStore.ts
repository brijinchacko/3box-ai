'use client';

import { create } from 'zustand';

const TOTAL_STEPS = 9;

interface TourState {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToStep: (step: number) => void;
}

export const useTourStore = create<TourState>((set) => ({
  isActive: false,
  currentStep: 0,

  startTour: () => set({ isActive: true, currentStep: 0 }),

  nextStep: () =>
    set((state) => {
      if (state.currentStep >= TOTAL_STEPS - 1) {
        localStorage.setItem('dashboard-tour-completed', 'true');
        return { isActive: false, currentStep: 0 };
      }
      return { currentStep: state.currentStep + 1 };
    }),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),

  skipTour: () => {
    localStorage.setItem('dashboard-tour-completed', 'true');
    set({ isActive: false, currentStep: 0 });
  },

  goToStep: (step: number) =>
    set({ currentStep: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }),
}));
