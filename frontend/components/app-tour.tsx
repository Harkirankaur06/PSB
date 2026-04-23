'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const TOUR_STORAGE_KEY = 'legend.appTourComplete';

type TourStep = {
  id: string;
  title: string;
  description: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 'brand',
    title: 'Your command center',
    description: 'Use the L.E.G.E.N.D. header to get back to the main dashboard from anywhere.',
  },
  {
    id: 'sidebar',
    title: 'Core navigation',
    description:
      'This sidebar is the fastest way to move across dashboard, portfolio, actions, security, contacts, and settings.',
  },
  {
    id: 'notifications',
    title: 'Live alerts',
    description:
      'Notifications collect security updates, portfolio changes, and reminders pulled from the backend.',
  },
  {
    id: 'profile-menu',
    title: 'Profile controls',
    description:
      'Open your profile menu to review account details, balances, trust score, and jump into settings.',
  },
  {
    id: 'duress-status',
    title: 'Safety controls',
    description:
      'If protected mode is ever triggered, status and recovery actions are surfaced here so you can safely review the session.',
  },
  {
    id: 'page-content',
    title: 'Workspace area',
    description:
      'The main page area shows masked data, insights, and actions based on your current account and security state.',
  },
];

function readCompletion() {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.localStorage.getItem(TOUR_STORAGE_KEY) === 'done';
}

export function AppTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!readCompletion() && window.localStorage.getItem('accessToken')) {
        setOpen(true);
      }
    }, 700);

    const handleStart = () => {
      window.localStorage.removeItem(TOUR_STORAGE_KEY);
      setStepIndex(0);
      setOpen(true);
    };

    window.addEventListener('legend-tour:start', handleStart as EventListener);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('legend-tour:start', handleStart as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateTarget = () => {
      const element = document.querySelector(`[data-tour-id="${currentStep.id}"]`);
      setTargetRect(element instanceof HTMLElement ? element.getBoundingClientRect() : null);
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [currentStep.id, open]);

  const panelCopy = useMemo(
    () => `${stepIndex + 1} / ${TOUR_STEPS.length}`,
    [stepIndex]
  );

  const closeTour = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'done');
    }

    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[1px]" />

      {targetRect && (
        <div
          className="pointer-events-none fixed z-[91] rounded-2xl border-2 border-primary bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] transition-all duration-200"
          style={{
            top: Math.max(targetRect.top - 8, 8),
            left: Math.max(targetRect.left - 8, 8),
            width: Math.min(targetRect.width + 16, window.innerWidth - 16),
            height: Math.min(targetRect.height + 16, window.innerHeight - 16),
          }}
        />
      )}

      <div className="fixed bottom-6 right-6 z-[92] w-full max-w-sm px-4 sm:px-0">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Product Tour
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">{currentStep.title}</h3>
              <span className="text-xs text-muted-foreground">{panelCopy}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{currentStep.description}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTour}
              data-duress-allow="true"
            >
              Skip
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={stepIndex === 0}
                data-duress-allow="true"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (stepIndex === TOUR_STEPS.length - 1) {
                    closeTour();
                    return;
                  }

                  setStepIndex((current) => current + 1);
                }}
                data-duress-allow="true"
              >
                {stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
