'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'primary' | 'neutral' | 'success' | 'warning';
  delayIndex?: number;
}

export function QuickAccessCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  delayIndex = 0,
}: QuickAccessCardProps) {
  const badgeStyles = {
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    neutral: 'bg-surface-100 text-surface-600 border-surface-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delayIndex * 0.08 }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Link href={href} className="block h-full">
        <div className="h-full p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card hover:shadow-elevated hover:border-surface-300 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-50 border border-surface-200/60 text-brand-600 flex items-center justify-center group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors">
                <Icon className="w-5 h-5" />
              </div>

              {badge && (
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', badgeStyles[badgeVariant])}>
                  {badge}
                </span>
              )}
            </div>

            <h4 className="text-base font-semibold text-surface-900 group-hover:text-brand-600 transition-colors">
              {title}
            </h4>
            <p className="text-xs text-surface-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-surface-100 flex items-center justify-between text-xs font-medium text-surface-600 group-hover:text-brand-600">
            <span>View details</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
