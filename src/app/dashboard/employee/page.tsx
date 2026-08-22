'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import { useLeaves } from '@/hooks/useLeaves';
import { QuickAccessCard } from '@/components/dashboard/QuickAccessCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function EmployeeDashboardPage() {
  const { profile, user, isLoading } = useAuth();
  const { todayRecord, clockIn, clockOut, isSubmitting: isAttendanceSubmitting } = useAttendance();
  const { balances, leaves } = useLeaves();

  const firstName = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : user?.email?.split('@')[0] || 'Team Member';

  const isCheckedIn = !!todayRecord && !todayRecord.checkOut;
  const isCompleted = !!todayRecord && !!todayRecord.checkOut;
  const pendingLeavesCount = leaves.filter((l) => l.status === 'PENDING').length;

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
      {/* Welcome Banner with One-Click Punch Clock */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100/80 text-brand-800 text-[11px] font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-brand-600" />
            <span>Employee Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            {profile?.designation || 'Software Engineer'} • {profile?.department || 'Engineering'} • ID: {profile?.employeeId || 'EMP'}
          </p>
        </div>

        {/* Quick Shift Punch Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {!todayRecord && (
            <Button
              size="md"
              variant="primary"
              onClick={() => clockIn()}
              isLoading={isAttendanceSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
              className="shadow-sm font-semibold"
            >
              Clock In for Today
            </Button>
          )}

          {isCheckedIn && (
            <div className="flex items-center gap-3">
              <Badge variant="success" size="md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Shift Active
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                onClick={() => clockOut()}
                isLoading={isAttendanceSubmitting}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Clock Out
              </Button>
            </div>
          )}

          {isCompleted && (
            <Badge variant="neutral" size="md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              Shift Completed Today
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500">
            Quick Navigation & Modules
          </h2>
          <span className="text-xs text-emerald-600 font-medium">All Modules Live</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAccessCard
            title="My Profile"
            description="View salary structure, contact info, and edit residential/phone details."
            href="/dashboard/employee/profile"
            icon={User}
            badge="Verified"
            badgeVariant="primary"
            delayIndex={0}
          />

          <QuickAccessCard
            title="Daily Attendance"
            description="Digital punch clock, shift duration tracking, and full monthly logs."
            href="/dashboard/employee/attendance"
            icon={CalendarCheck}
            badge={isCheckedIn ? 'Active Shift' : isCompleted ? 'Completed' : 'Clock In'}
            badgeVariant={isCheckedIn ? 'success' : 'neutral'}
            delayIndex={1}
          />

          <QuickAccessCard
            title="Leave Requests"
            description="Submit time-off requests, check quota balances, and track approvals."
            href="/dashboard/employee/leaves"
            icon={CalendarDays}
            badge={pendingLeavesCount > 0 ? `${pendingLeavesCount} Under Review` : `${balances.casual + balances.sick + balances.paid} Days Left`}
            badgeVariant={pendingLeavesCount > 0 ? 'warning' : 'primary'}
            delayIndex={2}
          />
        </div>
      </div>

      {/* Live Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
