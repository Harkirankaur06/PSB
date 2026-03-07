'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationMenu } from './notification-menu';
import { ProfileMenu } from './profile-menu';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 right-0 left-0 z-40 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <h1 className="text-xl font-semibold text-primary hover:text-primary/90 transition-colors cursor-pointer">L.E.G.E.N.D.</h1>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  isActive('/dashboard')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  isActive('/portfolio')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Portfolio
              </Button>
            </Link>
            <Link href="/invest">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  isActive('/invest')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Invest
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
}
