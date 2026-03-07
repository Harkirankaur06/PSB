'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 right-0 left-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/">
          <h1 className="text-xl font-semibold text-primary hover:text-primary/90 transition-colors cursor-pointer">L.E.G.E.N.D.</h1>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border p-4 space-y-3">
          <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
          <a href="#security" className="block text-muted-foreground hover:text-foreground">Security</a>
          <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground">How It Works</a>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/login" className="w-full">
              <Button variant="ghost" size="sm" className="w-full">
                Login
              </Button>
            </Link>
            <Link href="/signup" className="w-full">
              <Button size="sm" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
