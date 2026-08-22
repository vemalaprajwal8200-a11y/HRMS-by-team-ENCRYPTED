'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DodgeButton } from '@/components/DodgeButton';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      {/* ========================================================================= */}
      {/* VIBRANT MESH GRADIENT BACKGROUND BLOBS */}
      {/* ========================================================================= */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left Indigo / Violet Glow */}
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] max-w-[650px] h-[55vw] max-h-[650px] rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/25 to-pink-500/20 blur-[100px] sm:blur-[130px] transform -rotate-12 animate-pulse [animation-duration:8s]" />

        {/* Bottom-right Pink / Rose Glow */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] max-w-[700px] h-[60vw] max-h-[700px] rounded-full bg-gradient-to-tl from-pink-500/30 via-rose-400/20 to-indigo-500/20 blur-[110px] sm:blur-[140px] transform rotate-12 animate-pulse [animation-duration:10s]" />

        {/* Center / Subtle Cyan-Blue Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] max-w-[480px] h-[40vw] max-h-[480px] rounded-full bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-violet-500/15 blur-[90px]" />

        {/* Subtle grid texture overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* ========================================================================= */}
      {/* BRAND HEADER LOGO */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 mb-6 text-center"
      >
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200 ring-2 ring-white/80">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 drop-shadow-sm flex items-center gap-0.5">
              Dayflow<span className="text-brand-600">.</span>
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 -mt-1">
              Enterprise HRMS
            </span>
          </div>
        </Link>
      </motion.div>

      {/* ========================================================================= */}
      {/* FROSTED GLASS CARD SHELL (STATIC) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full max-w-[460px]"
      >
        <div className="relative rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_20px_70px_-15px_rgba(79,70,229,0.18)] p-7 sm:p-9 ring-1 ring-black/[0.04] overflow-hidden">
          {/* Top decorative gradient border line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Inner dynamic content with route transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* PLAYFUL DODGE BUTTON MICRO-INTERACTION */}
        {/* ========================================================================= */}
        <div className="mt-3.5 flex justify-center overflow-visible">
          <DodgeButton />
        </div>

        {/* ========================================================================= */}
        {/* FOOTER TRUST BADGE */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 text-center space-y-1.5"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-white/60 text-slate-600 text-xs font-medium shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bank-Grade 256-Bit Security & Role-Based RBAC</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Dayflow Human Resource Management System • Odoo x NMIT Hackathon
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
