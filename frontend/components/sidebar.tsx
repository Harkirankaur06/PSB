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
  TrendingUp,
  ScanSearch,
  Landmark
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  {
    icon: Home,
    label: 'Dashboard',
    href: '/dashboard',
    description: 'See your overall account snapshot, balances, alerts, and recent activity in one place.',
  },
  {
    icon: Briefcase,
    label: 'Portfolio',
    href: '/portfolio',
    description: 'Review holdings, allocation, and how your invested money is performing right now.',
  },
  {
    icon: TrendingUp,
    label: 'Invest',
    href: '/invest',
    description: 'Explore investment actions, SIP ideas, and ways to deploy available cash.',
  },
  {
    icon: Target,
    label: 'Goals & Planning',
    href: '/goals',
    description: 'Track savings goals, deadlines, and how close you are to each target.',
  },
  {
    icon: Brain,
    label: 'AI Insights',
    href: '/insights',
    description: 'Get account-specific AI recommendations, guidance, and navigation help.',
  },
  {
    icon: ScanSearch,
    label: 'SecureWealth Twin',
    href: '/twin',
    description: 'Open the explainable risk workflow that connects user behavior, finance, and security decisions.',
  },
  {
    icon: Zap,
    label: 'Future Simulator',
    href: '/simulator',
    description: 'Test what-if scenarios and see how future changes could affect your finances.',
  },
  {
    icon: AlertCircle,
    label: 'Action Center',
    href: '/actions',
    description: 'View the highest-priority actions, reviews, and recommendations waiting for you.',
  },
  {
    icon: Shield,
    label: 'Protection',
    href: '/protection',
    description: 'Check safeguards, coverage-style protections, and resilience recommendations.',
  },
  {
    icon: Clock,
    label: 'Security Timeline',
    href: '/security',
    description: 'Review trust signals, verification status, and security events affecting this account.',
  },
  {
    icon: Landmark,
    label: 'Bank Connections',
    href: '/banks',
    description: 'Link up to three dummy bank accounts and sync their balances and transactions into L.E.G.E.N.D.',
  },
  {
    icon: Users,
    label: 'Trusted Contacts',
    href: '/contacts',
    description: 'Manage trusted people who can help with alerts, recovery, and account support.',
  },
  {
    icon: MoreHorizontal,
    label: 'Settings',
    href: '/settings',
    description: 'Update profile details, security controls, private access settings, and account options.',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 w-56 border-r border-sidebar-border bg-sidebar pt-6"
      data-tour-id="sidebar"
    >
      <nav className="space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  data-tour-id={item.href === '/settings' ? 'settings-link' : undefined}
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
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="max-w-64 rounded-xl px-4 py-3">
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-[11px] leading-4 opacity-90">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
