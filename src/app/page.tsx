'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Users, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/employee');
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-surface-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-surface-900">
              Dayflow<span className="text-brand-600">.</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-8 shadow-subtle"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Odoo x NMIT Hackathon 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-surface-900 max-w-3xl leading-[1.15]"
        >
          Human resource management, <br />
          <span className="text-brand-600">reimagined for clarity.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-surface-600 max-w-2xl font-normal leading-relaxed"
        >
          Dayflow streamlines employee operations, authenticated role-based dashboards, and
          verified team profiles with modern performance and security.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/signup">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create Employee / Admin Account
            </Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="outline">
              Sign In to Portal
            </Button>
          </Link>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-surface-900 mb-1">
              Role-Based Security
            </h3>
            <p className="text-xs text-surface-500 leading-relaxed">
              Strict Postgres Row Level Security and Next.js middleware guards for Employee and Admin workspaces.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-surface-900 mb-1">
              Unified Team Profiles
            </h3>
            <p className="text-xs text-surface-500 leading-relaxed">
              Centralized personal records, job designations, salary structures, and document verification.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-surface-900 mb-1">
              Lightning Fast & Modern
            </h3>
            <p className="text-xs text-surface-500 leading-relaxed">
              Built on Next.js 14 App Router and Tailwind CSS with smooth Framer Motion micro-interactions.
            </p>
          </div>
        </motion.div>
      </main>

    </div>
  );
}
