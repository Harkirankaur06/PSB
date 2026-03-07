import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Action Center - L.E.G.E.N.D.',
  description: 'Review recommended actions',
};

export default function ActionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
