'use client';

import React from 'react';
import { TopNav } from '@/components/dashboard/TopNav';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-50 flex flex-col">
        <TopNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-surface-200/80 bg-white/50 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-surface-400">
            Dayflow HRMS • Odoo x NMIT Hackathon 2026 • Phase 1
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
