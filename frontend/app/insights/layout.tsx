import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'AI Insights - L.E.G.E.N.D.',
  description: 'Get personalized financial insights',
};

export default function InsightsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
