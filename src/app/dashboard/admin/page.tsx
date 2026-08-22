'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  TrendingUp,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EmployeeTable } from '@/components/dashboard/EmployeeTable';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { employees, isLoading: employeesLoading } = useEmployees();

  const totalEmployees = employees.length;

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/80 via-white to-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-semibold mb-1">
            <Shield className="w-3 h-3 text-brand-600" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Organization Overview
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            Managing records for {profile?.fullName || user?.email} • Human Resources & Operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            <Sparkles className="w-3 h-3 mr-1 text-brand-600" />
            System Healthy
          </Badge>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200 text-surface-700">
            {profile?.employeeId || 'ADMIN-01'}
          </span>
        </div>
      </motion.div>

      {/* 3 KPI Metric Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500">
            Live Metrics & Telemetry
          </h2>
          <span className="text-xs text-surface-400">Phase 1 Foundation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard
            title="Total Employees"
            value={employeesLoading ? '...' : totalEmployees}
            description="Active verified team member profiles in database"
            icon={Users}
            trend="+100%"
            trendPositive={true}
            accentColor="brand"
            delayIndex={0}
          />

          <MetricCard
            title="Pending Approvals"
            value="0"
            description="Leave and profile update requests requiring review"
            icon={FileCheck}
            trend="All caught up"
            trendPositive={true}
            accentColor="amber"
            delayIndex={1}
          />

          <MetricCard
            title="Today's Attendance"
            value="100%"
            description="Employees checked-in on scheduled shifts"
            icon={UserCheck}
            trend="Nominal"
            trendPositive={true}
            accentColor="emerald"
            delayIndex={2}
          />
        </div>
      </div>

      {/* Employee List Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-surface-900">
              Employee Directory
            </h2>
            <p className="text-xs text-surface-500">
              View employee records, department assignments, and access levels
            </p>
          </div>
        </div>

        <EmployeeTable
          employees={employees}
          isLoading={employeesLoading}
        />
      </div>
    </div>
  );
}
