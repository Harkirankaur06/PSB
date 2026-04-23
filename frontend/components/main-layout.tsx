'use client';

import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { AppTour } from './app-tour';
import { useSessionSecurity } from '@/lib/session-security';
import Link from 'next/link';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { duressActive, status } = useSessionSecurity();

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background ml-56">
          <div className="p-6">
            <AppTour />

            <div data-tour-id="duress-status">
              {duressActive ? (
                <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Protected mode is active
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sensitive controls are temporarily limited while this session stays in
                        silent review mode.
                        {status?.fakeDashboardMode ? ' Sensitive balances are also masked.' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" data-duress-allow="true">
                        <Link href="/security">Review security</Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        data-duress-allow="true"
                      >
                        <Link href="/settings">Mark safe now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-border bg-card/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Session status looks normal
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Navigation, insights, and action controls are fully available on this
                        device.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.dispatchEvent(new Event('legend-tour:start'))}
                      data-duress-allow="true"
                    >
                      Show tour
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div
              className={duressActive ? 'duress-readonly space-y-6' : 'space-y-6'}
              data-tour-id="page-content"
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
