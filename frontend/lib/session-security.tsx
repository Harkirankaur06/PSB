'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { getDuressProtectionState, setDuressProtection } from '@/lib/behavior-monitor';

export interface SessionSecurityStatus {
  hasPin: boolean;
  hasBiometric: boolean;
  biometricEnabled: boolean;
  hasWebAuthnCredentials: boolean;
  secondFactorVerified: boolean;
  needsSetup: boolean;
  requiresVerification: boolean;
  accessMode?: 'normal' | 'duress';
  restrictedMode?: boolean;
  fakeDashboardMode?: boolean;
  delayedActions?: boolean;
  hasDuressPassword?: boolean;
  promptTrustDevice?: boolean;
  currentDevice?: {
    deviceId: string;
    deviceName?: string;
    lastUsed?: string;
    isTrusted?: boolean;
  } | null;
}

interface SessionSecurityContextValue {
  authenticated: boolean;
  loading: boolean;
  status: SessionSecurityStatus | null;
  duressActive: boolean;
  refreshStatus: () => Promise<SessionSecurityStatus | null>;
}

const SessionSecurityContext = createContext<SessionSecurityContextValue | undefined>(undefined);

function hasAccessToken() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem('accessToken'));
}

export function SessionSecurityProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionSecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refreshStatus = useCallback(async () => {
    const loggedIn = hasAccessToken();
    setAuthenticated(loggedIn);

    if (!loggedIn) {
      setStatus(null);
      setDuressProtection(false);
      setLoading(false);
      return null;
    }

    try {
      const nextStatus = await apiRequest<SessionSecurityStatus>('/api/security/status');
      setStatus(nextStatus);
      setDuressProtection(
        nextStatus.accessMode === 'duress' || Boolean(nextStatus.restrictedMode)
      );
      return nextStatus;
    } catch {
      setStatus(null);
      setDuressProtection(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    const handleStorage = () => {
      refreshStatus();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('legend-security-refresh', handleStorage as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('legend-security-refresh', handleStorage as EventListener);
    };
  }, [refreshStatus]);

  const value = useMemo(
    () => ({
      authenticated,
      loading,
      status,
      duressActive:
        status?.accessMode === 'duress' ||
        Boolean(status?.restrictedMode) ||
        getDuressProtectionState(),
      refreshStatus,
    }),
    [authenticated, loading, refreshStatus, status]
  );

  return (
    <SessionSecurityContext.Provider value={value}>
      {children}
    </SessionSecurityContext.Provider>
  );
}

export function useSessionSecurity() {
  const context = useContext(SessionSecurityContext);

  if (!context) {
    throw new Error('useSessionSecurity must be used within a SessionSecurityProvider');
  }

  return context;
}
