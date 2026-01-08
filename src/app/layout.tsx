import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AppLayout from '@/layouts/layout-app';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'Insightimate',
  description: 'Insightimate - AI-Powered Project Management',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
