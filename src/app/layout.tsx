import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AppLayout from '@/layouts/layout-app';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'Project Management App',
  description: 'A modern project management application',
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
