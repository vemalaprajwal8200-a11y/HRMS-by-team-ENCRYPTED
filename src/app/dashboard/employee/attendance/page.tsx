'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  ArrowLeft,
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useAttendance } from '@/hooks/useAttendance';
import type { AttendanceStatus } from '@/lib/attendance/status';
import { toDateStr } from '@/lib/attendance/status';
import type { AttendanceRecord } from '@/types/attendance';

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function formatDateLabel(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr + 'T00:00:00'));
  } catch {
    return dateStr;
  }
}

const STATUS_BADGE: Record<AttendanceStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'primary'; label: string }> = {
  present: { variant: 'success', label: 'Present' },
  half_day: { variant: 'warning', label: 'Half Day' },
  absent: { variant: 'danger', label: 'Absent' },
  leave: { variant: 'primary', label: 'Leave' },
};

export default function AttendancePage() {
  const { range, setRange, records, today, isLoading, actionLoading, error, checkIn, checkOut, refetch } =
    useAttendance('daily');

  const state = useMemo<'none' | 'checked_in' | 'done'>(() => {
    if (today?.checkOut) return 'done';
    if (today?.checkIn) return 'checked_in';
    return 'none';
  }, [today]);

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, half_day: 0, leave: 0 };
    records.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/employee"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-500 hover:text-surface-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600" /> Daily Attendance
          </h1>
          <p className="text-sm text-surface-600 mt-1">
            One-tap check in / check out. Your status is derived automatically.
          </p>
        </div>
        <Badge variant="primary" size="md">
          Phase 3 Live
        </Badge>
      </div>

      {/* Live check-in / check-out card */}
      <Card className="border-brand-100 bg-gradient-to-r from-brand-50/60 via-white to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">
              Today &middot; {formatDateLabel(toDateStr(new Date()))}
            </div>

            {state === 'none' && (
              <div className="text-lg font-semibold text-surface-900">
                You haven&apos;t checked in yet.
              </div>
            )}
            {state === 'checked_in' && (
              <div className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Checked in at {formatTime(today?.checkIn)}
              </div>
            )}
            {state === 'done' && (
              <div className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Done for today ✓
              </div>
            )}

            <div className="text-xs text-surface-500">
              {state === 'checked_in' && 'Tap check out when you finish for the day.'}
              {state === 'done' && <>Checked out at {formatTime(today?.checkOut)} &middot; Status: {STATUS_BADGE[today!.status].label}</>}
              {state === 'none' && 'Tap check in to start your day.'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state === 'none' && (
              <Button onClick={checkIn} isLoading={actionLoading} leftIcon={<LogIn className="w-4 h-4" />} size="lg">
                Check In
              </Button>
            )}
            {state === 'checked_in' && (
              <Button
                onClick={checkOut}
                isLoading={actionLoading}
                variant="secondary"
                leftIcon={<LogOut className="w-4 h-4" />}
                size="lg"
              >
                Check Out
              </Button>
            )}
            {state === 'done' && (
              <Button variant="outline" disabled leftIcon={<CheckCircle2 className="w-4 h-4" />} size="lg">
                Done for today
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </Card>

      {/* Range toggle + summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-surface-200 bg-white p-1 shadow-subtle">
          <button
            onClick={() => setRange('daily')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              range === 'daily' ? 'bg-brand-600 text-white' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Daily
          </button>
          <button
            onClick={() => setRange('weekly')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              range === 'weekly' ? 'bg-brand-600 text-white' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Weekly
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="success">P {summary.present}</Badge>
            <Badge variant="warning">H {summary.half_day}</Badge>
            <Badge variant="danger">A {summary.absent}</Badge>
            <Badge variant="primary">L {summary.leave}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={refetch} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Records table */}
      <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                <th className="py-3 px-4 sm:px-6">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton rows={range === 'weekly' ? 7 : 1} />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-500">
                    <Clock className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                    <p className="font-medium text-sm text-surface-700">No attendance records</p>
                  </td>
                </tr>
              ) : (
                records.map((r: AttendanceRecord) => {
                  const badge = STATUS_BADGE[r.status];
                  return (
                    <tr key={r.date} className="hover:bg-surface-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-surface-900">
                        {formatDateLabel(r.date)}
                      </td>
                      <td className="py-3.5 px-4 text-surface-600">{formatTime(r.checkIn)}</td>
                      <td className="py-3.5 px-4 text-surface-600">{formatTime(r.checkOut)}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-surface-400 text-[11px]">
                        {r.source === 'leave_sync' ? 'Leave Sync' : r.synthesized ? 'Auto' : 'Auto'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
