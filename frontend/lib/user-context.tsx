'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/api-client';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const USER_CACHE_KEY = 'legendUserProfile';

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

const DEFAULT_USER: User = {
  id: 'local-user',
  name: 'User',
  email: 'user@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
  balance: 0,
  netWorth: 0,
  currency: 'INR',
};

function getInitialUser() {
  if (typeof window === 'undefined') {
    return DEFAULT_USER;
  }

  const cached = localStorage.getItem(USER_CACHE_KEY);

  if (!cached) {
    return DEFAULT_USER;
  }

  try {
    return JSON.parse(cached) as User;
  } catch {
    return DEFAULT_USER;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(getInitialUser);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuthStorage = React.useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceId');
    localStorage.removeItem(USER_CACHE_KEY);
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
        const headerData = await apiRequest<{
          profile: {
            id: string;
            name: string;
            email: string;
            balance: number;
            netWorth: number;
          };
        }>('/api/app/header');

        const nextUser = {
          id: headerData.profile.id,
          name: headerData.profile.name,
          email: headerData.profile.email,
          balance: headerData.profile.balance || 0,
          netWorth: headerData.profile.netWorth || 0,
          currency: 'INR',
        };

        setUser(nextUser);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(nextUser));
      } catch {
        setUser((current) => current || DEFAULT_USER);
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
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(newUser));
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
