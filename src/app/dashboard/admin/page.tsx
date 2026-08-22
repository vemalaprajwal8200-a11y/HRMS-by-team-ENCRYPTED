'use client';

import React, { useEffect, useState } from 'react';
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CreateEmployee } from '@/components/dashboard/CreateEmployee';

export default function AdminDashboardPage() {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { employees, isLoading: employeesLoading } = useEmployees();

  const totalEmployees = employees.length;
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<Record<string, number> | null>(null);
  const [metricsError, setMetricsError] = useState(false);
  const chartData = attendanceSummary ? Object.entries(attendanceSummary).map(([status, count]) => ({ status: status.replace('_', ' '), count })) : [];

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/leave-requests?status=PENDING').then((response) => response.ok ? response.json() : Promise.reject()),
      fetch(`/api/attendance?date=${new Date().toISOString().slice(0, 10)}`).then((response) => response.ok ? response.json() : Promise.reject()),
    ]).then(([leaveResult, attendanceResult]) => {
      if (!active) return;
      setPendingApprovals((leaveResult.requests || []).length);
      const summary: Record<string, number> = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0 };
      (attendanceResult.records || []).forEach((record: { status: string }) => { summary[record.status] = (summary[record.status] || 0) + 1; });
      setAttendanceSummary(summary);
    }).catch(() => { if (active) setMetricsError(true); });
    return () => { active = false; };
  }, []);

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
            value={pendingApprovals === null ? '...' : pendingApprovals}
            description="Leave and profile update requests requiring review"
            icon={FileCheck}
            trend={pendingApprovals === 0 ? 'All caught up' : 'Needs review'}
            trendPositive={pendingApprovals === 0}
            accentColor="amber"
            delayIndex={1}
          />

          <MetricCard
            title="Today's Attendance"
            value={attendanceSummary ? Object.values(attendanceSummary).reduce((sum, value) => sum + value, 0) : '...'}
            description="Today's attendance records by status"
            icon={UserCheck}
            trend="Nominal"
            trendPositive={true}
            accentColor="emerald"
            delayIndex={2}
          />
        </div>
      </div>

      {metricsError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Live metrics could not be loaded. Refresh to try again.</div>}
      <div className="rounded-2xl border border-surface-200/90 bg-white p-6 shadow-card">
        <h2 className="text-base font-bold text-surface-900">Today&apos;s status breakdown</h2>
        {attendanceSummary ? <ResponsiveContainer width="100%" height={220}><BarChart data={chartData}><XAxis dataKey="status" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#5b4bdb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="mt-5 h-20 animate-pulse rounded-xl bg-surface-100" />}
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
          <CreateEmployee onCreated={() => window.location.reload()} />
        </div>

        <EmployeeTable
          employees={employees}
          isLoading={employeesLoading}
        />
      </div>
    </div>
  );
}
