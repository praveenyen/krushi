import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Money Tracker | Personal Finance Management',
  description: 'Track your financial relationships, manage transactions, and visualize your money flow with interactive charts and insights.',
  keywords: ['money tracker', 'personal finance', 'debt tracking', 'credit management', 'financial dashboard'],
  openGraph: {
    title: 'Money Tracker | Personal Finance Management',
    description: 'Track your financial relationships, manage transactions, and visualize your money flow with interactive charts and insights.',
    type: 'website',
  },
};

export default function MoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}