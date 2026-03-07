import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Dashboard - L.E.G.E.N.D.',
  description: 'Manage your wealth with AI-powered insights',
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
