import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dayflow HRMS — Modern Human Resource Management',
  description: 'Clean, reliable, and modern HR platform for Odoo x NMIT Bangalore Hackathon 2026',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-50 font-sans text-surface-900 antialiased selection:bg-brand-500 selection:text-white">
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
