'use client';

import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark-shell min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-card group-hover:bg-brand-700 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-surface-900">
            Dayflow<span className="text-brand-600">.</span>
          </span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0"
      >
        <div className="bg-white py-8 px-6 sm:px-8 border border-surface-200/90 rounded-2xl shadow-card">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-surface-500">
          Dayflow HRMS • Secure Role-Based Authentication
        </p>
      </motion.div>
    </div>
  );
}
