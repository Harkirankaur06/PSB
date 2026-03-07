import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Portfolio - L.E.G.E.N.D.',
  description: 'Manage your investment portfolio',
};

export default function PortfolioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
