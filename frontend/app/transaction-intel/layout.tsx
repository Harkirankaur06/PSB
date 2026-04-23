import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transaction Intelligence - L.E.G.E.N.D.',
  description: 'Transaction history transformed into risk intelligence, behavior analytics, and fraud prevention demos.',
};

export default function TransactionIntelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
