'use client';

import { 
  Home, 
  Target, 
  Brain, 
  Zap, 
  AlertCircle, 
  Shield, 
  Clock, 
  Users, 
  MoreHorizontal,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'Portfolio', href: '/portfolio' },
  { icon: TrendingUp, label: 'Invest', href: '/invest' },
  { icon: Target, label: 'Goals & Planning', href: '/goals' },
  { icon: Brain, label: 'AI Insights', href: '/insights' },
  { icon: Zap, label: 'Future Simulator', href: '/simulator' },
  { icon: AlertCircle, label: 'Action Center', href: '/actions' },
  { icon: Shield, label: 'Protection', href: '/protection' },
  { icon: Clock, label: 'Security Timeline', href: '/security' },
  { icon: Users, label: 'Trusted Contacts', href: '/contacts' },
  { icon: MoreHorizontal, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 border-r border-sidebar-border bg-sidebar pt-6">
      <nav className="space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
