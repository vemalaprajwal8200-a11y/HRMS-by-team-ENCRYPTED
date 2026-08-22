'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

export default function AttendancePage() {
  const { profile } = useAuth();
  const {
    todayRecord,
    history,
    summary,
    isLoading,
    isSubmitting,
    error,
    clockIn,
    clockOut,
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = async () => {
    setSuccessNotice(null);
    const res = await clockIn();
    if (!res.error) {
      setSuccessNotice('Checked in successfully! Have a productive shift.');
    }
  };

  const handleClockOut = async () => {
    setSuccessNotice(null);
    const res = await clockOut();
    if (!res.error) {
      setSuccessNotice('Checked out successfully. Good work today!');
    }
  };

  const isCheckedIn = !!todayRecord && !todayRecord.checkOut;
  const isCompleted = !!todayRecord && !!todayRecord.checkOut;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/employee">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-surface-600 hover:text-surface-900"
          >
            Back to Dashboard
          </Button>
        </Link>

        <Badge variant="primary" size="md">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
          Live Attendance Sync
        </Badge>
      </div>

      {/* Clock In / Out Action Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50/60 via-white to-white shadow-card flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span>Digital Punch Clock</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-surface-900">
            {currentTime || '10:00:00 AM'}
          </h1>

          <p className="text-xs sm:text-sm text-surface-600">
            Current Shift • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>

          {/* Status message */}
          <div className="pt-1">
            {!todayRecord && (
              <Badge variant="warning" size="md">
                Not Checked In Today
              </Badge>
            )}
            {isCheckedIn && (
              <Badge variant="success" size="md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Shift Active • Checked in at{' '}
                {new Date(todayRecord.checkIn!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="neutral" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                Shift Completed • Out at{' '}
                {new Date(todayRecord.checkOut!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {!todayRecord && (
            <Button
              size="lg"
              variant="primary"
              className="w-full md:w-56 py-3.5 shadow-md text-sm font-bold"
              onClick={handleClockIn}
              isLoading={isSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Clock In Now
            </Button>
          )}

          {isCheckedIn && (
            <Button
              size="lg"
              variant="primary"
              className="w-full md:w-56 py-3.5 shadow-md text-sm font-bold bg-amber-600 hover:bg-amber-700 border-amber-600"
              onClick={handleClockOut}
              isLoading={isSubmitting}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Clock Out & Wrap Shift
            </Button>
          )}

          {isCompleted && (
            <div className="p-3 bg-surface-100 rounded-xl text-surface-600 text-xs font-medium text-center">
              All set for today! Your shift duration was {todayRecord.workHours || 0} hrs.
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-surface-200 bg-white shadow-card space-y-1">
          <span className="text-xs text-surface-500 font-medium">Days Present (This Month)</span>
          <div className="text-2xl font-bold text-surface-900">{summary.presentDays} Days</div>
          <span className="text-[11px] text-emerald-600 font-medium">Verified attendance</span>
        </div>

        <div className="p-4 rounded-xl border border-surface-200 bg-white shadow-card space-y-1">
          <span className="text-xs text-surface-500 font-medium">Total Shifts Recorded</span>
          <div className="text-2xl font-bold text-surface-900">{history.length} Logs</div>
          <span className="text-[11px] text-surface-400">Lifetime database log</span>
        </div>

        <div className="p-4 rounded-xl border border-surface-200 bg-white shadow-card space-y-1">
          <span className="text-xs text-surface-500 font-medium">Attendance Rating</span>
          <div className="text-2xl font-bold text-brand-600">{summary.attendancePercentage}%</div>
          <span className="text-[11px] text-brand-600 font-medium">Punctuality standard</span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-surface-900">
            Attendance History Log
          </h2>
          <span className="text-xs text-surface-500">
            Showing all recorded sessions
          </span>
        </div>

        <div className="rounded-2xl border border-surface-200 bg-white shadow-card overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-surface-500 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-surface-300" />
              <p className="font-semibold text-sm text-surface-800">No attendance logs yet</p>
              <p className="text-xs text-surface-400">
                Click &quot;Clock In Now&quot; above to log your first work session.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                    <th className="py-3 px-4 sm:px-6">Date</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Hours Logged</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {history.map((record) => {
                    const checkInFormatted = record.checkIn
                      ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                    const checkOutFormatted = record.checkOut
                      ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Active';

                    return (
                      <tr key={record.id} className="hover:bg-surface-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-surface-900">
                          {formatDate(record.date)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                          {checkInFormatted}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-surface-600">
                          {checkOutFormatted}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-surface-800">
                          {record.workHours ? `${record.workHours} hrs` : '--'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <Badge
                            variant={record.status === 'PRESENT' ? 'success' : 'neutral'}
                            size="sm"
                            className="capitalize"
                          >
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
