import Link from 'next/link';
import { NotificationMenu } from './notification-menu';
import { ProfileMenu } from './profile-menu';

export function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-40 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" data-tour-id="brand">
            <div className="cursor-pointer">
              <h1 className="text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
                L.E.G.E.N.D.
              </h1>
              <p className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:block">
                Learning Engine for Guided Economic Navigation &amp; Decisions
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
}
