'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { QuickAccessCard } from '@/components/dashboard/QuickAccessCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

export default function EmployeeDashboardPage() {
  const { profile, user, isLoading } = useAuth();

  const firstName = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : user?.email?.split('@')[0] || 'Team Member';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100/80 text-brand-800 text-[11px] font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-brand-600" />
            <span>Employee Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            {profile?.designation || 'Software Engineer'} • {profile?.department || 'Engineering'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            Active Session
          </Badge>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200 text-surface-700">
            {profile?.employeeId || 'EMP-1001'}
          </span>
        </div>
      </motion.div>

      {/* Quick Access Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500">
            Quick Navigation
          </h2>
          <span className="text-xs text-surface-400">Your workspace</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAccessCard
            title="My Profile"
            description="View your full employee profile, job designation, and salary compensation breakdown."
            href="/dashboard/employee/profile"
            icon={User}
            badge="Live in Phase 1"
            badgeVariant="primary"
            delayIndex={0}
          />

          <QuickAccessCard
            title="Daily Attendance"
            description="Check-in/check-out logs, time-tracking records, and monthly attendance summary."
            href="/dashboard/employee/attendance"
            icon={CalendarCheck}
            badge="Live"
            badgeVariant="success"
            delayIndex={1}
          />

          <QuickAccessCard
            title="Leave Requests"
            description="Submit time-off requests, view pending reviews, and check remaining leave balances."
            href="/dashboard/employee/leaves"
            icon={CalendarDays}
            badge="Live"
            badgeVariant="success"
            delayIndex={2}
          />
        </div>
      </div>

      {/* Activity Feed Section */}
      <ActivityFeed />
    </div>
  );
}
