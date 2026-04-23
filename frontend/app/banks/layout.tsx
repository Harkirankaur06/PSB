import { ReactNode } from 'react';

export const metadata = {
  title: 'Bank Connections - L.E.G.E.N.D.',
  description: 'Connect and manage linked bank accounts',
};

export default function BanksLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
