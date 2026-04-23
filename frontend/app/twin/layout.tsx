import { MainLayout } from '@/components/main-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'SecureWealth Twin - L.E.G.E.N.D.',
  description: 'Virtual financial twin with embedded fraud protection',
};

export default function TwinLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
