import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Risk & Protection - L.E.G.E.N.D.',
  description: 'Manage your protection strategies',
};

export default function ProtectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
