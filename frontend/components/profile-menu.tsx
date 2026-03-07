'use client';

import { User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useUser } from '@/lib/user-context';
import Link from 'next/link';

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    // In a real app, you would redirect to login page
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-3 w-3 text-secondary-foreground" />
        </div>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-medium">${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Worth:</span>
                <span className="font-medium text-secondary">${user.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Link href="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
