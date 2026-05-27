import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinanceSnap — Quarterly Asset & Liability Tracker',
  description: 'Track your family\'s investments, liabilities, and financial health quarter by quarter. Generate beautiful PDF snapshot reports and visualize trends over time.',
  keywords: 'finance tracker, net worth, investments, TFSA, RRSP, RESP, quarterly snapshot, asset liability',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
