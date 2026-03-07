import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Future Simulator - L.E.G.E.N.D.',
  description: 'Simulate your financial future',
};

export default function SimulatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
