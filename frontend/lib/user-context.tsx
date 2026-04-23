'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/api-client';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
  netWorth: number;
  currency: string;
}

interface UserContextType {
  user: User | null;
  updateUser: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuthStorage = React.useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceId');
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    clearAuthStorage();
    window.location.href = '/login';
  }, [clearAuthStorage]);

  const resetInactivityTimer = React.useCallback(() => {
    if (!localStorage.getItem('accessToken')) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  React.useEffect(() => {
    const loadUser = async () => {
      if (!localStorage.getItem('accessToken')) {
        setUser(null);
        return;
      }

      try {
        const [profile, overview] = await Promise.all([
          apiRequest<{
            id: string;
            name: string;
            email: string;
          }>('/api/auth/profile'),
          apiRequest<{
            metrics: { netWorth: number };
            financial: { savings: number };
          }>('/api/app/overview'),
        ]);

        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          balance: overview.financial.savings || 0,
          netWorth: overview.metrics.netWorth || 0,
          currency: 'INR',
        });
      } catch {
        setUser(null);
      }
    };

    loadUser();

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    if (localStorage.getItem('accessToken')) {
      resetInactivityTimer();
    }

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetInactivityTimer]);

  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
