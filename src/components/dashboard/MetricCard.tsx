'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'brand' | 'emerald' | 'amber' | 'purple';
  delayIndex?: number;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendPositive = true,
  accentColor = 'brand',
  delayIndex = 0,
}: MetricCardProps) {
  const colorMap = {
    brand: {
      bg: 'bg-brand-50',
      text: 'text-brand-600',
      border: 'border-brand-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delayIndex * 0.08 }}
      className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card hover:shadow-elevated transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
          {title}
        </span>
        <div
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center',
            currentTheme.bg,
            currentTheme.text,
            currentTheme.border
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-bold tracking-tight text-surface-900">
          {value}
        </h3>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              trendPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            )}
          >
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-surface-500 leading-normal">
          {description}
        </p>
      )}
    </motion.div>
  );
}
