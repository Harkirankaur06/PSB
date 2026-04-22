'use client';

import React, { createContext, useContext, ReactNode } from 'react';

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

const DEFAULT_USER: User = {
  id: '1',
  name: 'Sarah Anderson',
  email: 'sarah.anderson@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  balance: 245680.5,
  netWorth: 1425680.5,
  currency: 'INR',
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(DEFAULT_USER);
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
