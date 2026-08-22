'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

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
    <main className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-40 border-b border-neutral-900/80 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-neutral-50">
              Dayflow<span className="text-brand-500">.</span>
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link href="/signin">
              <Button variant="ghost" size="sm" className="text-neutral-300 hover:bg-neutral-900 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" className="hover:scale-[1.02]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===================== HERO (DARK) ===================== */}
      <section className="relative overflow-hidden bg-neutral-950 text-neutral-100">
        {/* subtle brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:py-28 lg:py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Odoo x NMIT Hackathon 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: easeOut }}
            className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-neutral-50 sm:text-6xl lg:text-7xl"
          >
            Human resource management,{' '}
            <span className="text-neutral-400">reimagined for clarity.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: easeOut }}
            className="mx-auto mt-6 max-w-2xl text-base font-normal leading-relaxed text-neutral-400 sm:text-lg"
          >
            Dayflow streamlines employee operations, authenticated role-based dashboards, and
            verified team profiles with modern performance and security.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: easeOut }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/signup">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="hover:scale-[1.02]"
              >
                Create Employee / Admin Account
              </Button>
            </Link>
            <Link href="/signin">
              <Button
                size="lg"
                variant="outline"
                className="border-neutral-800 bg-transparent text-neutral-100 hover:bg-neutral-900 hover:scale-[1.02]"
              >
                Sign In to Portal
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===================== FEATURES (LIGHT) ===================== */}
      <section className="bg-neutral-50 py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-12 flex items-center gap-3"
          >
            <motion.span variants={fadeUp} className="font-mono text-xs font-semibold tracking-widest text-brand-600">
              (01)
            </motion.span>
            <motion.span variants={fadeUp} className="h-px w-8 bg-neutral-300" />
            <motion.span
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500"
            >
              Platform capabilities
            </motion.span>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {[
              {
                n: '01',
                title: 'Role-Based Security',
                desc: 'Strict Postgres Row Level Security and Next.js middleware guards for Employee and Admin workspaces.',
                icon: ShieldCheck,
              },
              {
                n: '02',
                title: 'Unified Team Profiles',
                desc: 'Centralized personal records, job designations, salary structures, and document verification.',
                icon: Users,
              },
              {
                n: '03',
                title: 'Lightning Fast & Modern',
                desc: 'Built on Next.js 14 App Router and Tailwind CSS with smooth Framer Motion micro-interactions.',
                icon: Zap,
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.n}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-elevated"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs font-semibold tracking-widest text-neutral-300">
                      {f.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===================== FOOTER (DARK) ===================== */}
      <footer className="bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Closing CTA */}
          <div className="flex flex-col gap-8 border-b border-neutral-900 pb-16 pt-20 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-xs font-semibold tracking-widest text-brand-600">(02)</span>
                <span className="h-px w-8 bg-neutral-800" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Get started
                </span>
              </div>
              <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-neutral-50 sm:text-4xl">
                Ready to reimagine human resource management?
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link href="/signup">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />} className="hover:scale-[1.02]">
                  Get Started
                </Button>
              </Link>
              <Link href="/signin">
                <Button size="lg" variant="ghost" className="text-neutral-300 hover:bg-neutral-900 hover:text-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Grouped links */}
          <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
            <div>
              <Link href="/" className="inline-flex items-center space-x-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-base font-extrabold tracking-tight text-neutral-50">
                  Dayflow<span className="text-brand-500">.</span>
                </span>
              </Link>
              <p className="mt-3 max-w-[14rem] text-xs leading-relaxed text-neutral-500">
                Modern human resource management, reimagined for clarity.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Product</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Attendance</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Leave</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Profiles</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Payroll</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Company</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                <li><Link href="#" className="transition-colors hover:text-neutral-100">About</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Careers</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Resources</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Documentation</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Support</Link></li>
                <li><Link href="#" className="transition-colors hover:text-neutral-100">Changelog</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-900 py-8 text-xs text-neutral-500 sm:flex-row">
            <span>© 2026 Dayflow HRMS</span>
            <span>Dayflow HRMS • Odoo x NMIT Bangalore Hackathon 2026 • Phase 1 Foundation</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
