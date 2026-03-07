import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Investment Opportunities - L.E.G.E.N.D.',
  description: 'Discover curated investment opportunities',
};

export default function InvestLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
