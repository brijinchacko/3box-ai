'use client';
import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/styles/driver-theme.css';
import { useTourStore } from '@/store/useTourStore';

export default function GuidedTour({ isFirstVisit }: { isFirstVisit: boolean }) {
  const tourStarted = useRef(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const { isActive, startTour, skipTour } = useTourStore();

  // Build driver instance
  const createDriver = () => {
    return driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        {
          element: '.pipeline-progress',
          popover: {
            title: 'Your job search pipeline',
            description: 'Track your progress from profile setup to landing an offer. Each step lights up as you complete it.',
            side: 'bottom',
            align: 'center',
          }
        },
        {
          element: '.action-card',
          popover: {
            title: 'Your next step',
            description: 'We always show you what to do next. Right now, your AI agents are finding matching jobs for you.',
            side: 'bottom',
            align: 'center',
          }
        },
        {
          element: '.apply-mode-selector',
          popover: {
            title: 'Choose how to apply',
            description: 'Apply manually by reviewing each job, or let AI auto-apply to high-match jobs. Your free plan includes 5 auto-applications per week.',
            side: 'top',
            align: 'center',
          }
        },
        {
          element: '[data-sidebar="find-jobs"]',
          popover: {
            title: 'Find Jobs',
            description: 'Scout searches 6+ job platforms and shows you the best matches. Your search profile is already set up.',
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-sidebar="my-resume"]',
          popover: {
            title: 'My Resume',
            description: 'Your resume was auto-generated. Switch between 4 templates, edit content, and export as PDF.',
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-sidebar="applications"]',
          popover: {
            title: 'Applications',
            description: 'Track every application. See status updates: Applied, Viewed, Interview, Offer.',
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-sidebar="interview-prep"]',
          popover: {
            title: 'Interview Prep',
            description: 'Practice with AI-generated interview questions specific to each company.',
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-sidebar="skill-growth"]',
          popover: {
            title: 'Skill Growth',
            description: 'See which skills to improve based on jobs you are targeting. Get personalized learning paths.',
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-sidebar="portfolio"]',
          popover: {
            title: 'Portfolio',
            description: 'Your professional portfolio page is already created. Edit and publish it as a live website.',
            side: 'right',
            align: 'start',
          }
        },
        {
          popover: {
            title: 'You are all set!',
            description: 'Your AI agents are ready to help you land your dream job. Start by reviewing the matching jobs found for you. Good luck!',
          }
        },
      ],
      onDestroyStarted: () => {
        localStorage.setItem('3box_tour_completed', 'true');
        localStorage.setItem('dashboard-tour-completed', 'true');
        skipTour();
        driverRef.current?.destroy();
      },
    });
  };

  // Auto-start on first visit
  useEffect(() => {
    if (!isFirstVisit || tourStarted.current) return;
    const tourCompleted = localStorage.getItem('3box_tour_completed');
    if (tourCompleted) return;

    tourStarted.current = true;

    const timeout = setTimeout(() => {
      const tourDriver = createDriver();
      driverRef.current = tourDriver;
      startTour();
      tourDriver.drive();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isFirstVisit]);

  // Re-trigger from UserMenu "Dashboard Guide" button
  useEffect(() => {
    if (!isActive || driverRef.current?.isActive()) return;

    const timeout = setTimeout(() => {
      const tourDriver = createDriver();
      driverRef.current = tourDriver;
      tourDriver.drive();
    }, 300);

    return () => clearTimeout(timeout);
  }, [isActive]);

  return null;
}
