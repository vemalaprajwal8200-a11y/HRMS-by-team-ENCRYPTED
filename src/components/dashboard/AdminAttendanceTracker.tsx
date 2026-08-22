'use client';

import React from 'react';
import { Clock, RefreshCw, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

interface AdminAttendanceTrackerProps {
  attendance: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AdminAttendanceTracker({
  attendance,
  isLoading,
  onRefresh,
}: AdminAttendanceTrackerProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (attendance.length === 0) {
    return (
      <div className="py-16 text-center text-surface-500 space-y-2 bg-white rounded-2xl border border-surface-200 shadow-card">
        <Clock className="w-10 h-10 mx-auto text-surface-300" />
        <p className="font-semibold text-sm text-surface-800">No Attendance Records Found</p>
        <p className="text-xs text-surface-400">
          When employees clock in from their portal, logs will update here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-surface-900">
            Attendance Activity Feed
          </h2>
          <p className="text-xs text-surface-500">
            Real-time clock-in and check-out records synced from employee workspaces
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Logs
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                <th className="py-3 px-4 sm:px-6">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {attendance.map((rec: any) => {
                const empProfile = rec.profiles || {};
                const checkInFormatted = rec.check_in
                  ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';
                const checkOutFormatted = rec.check_out
                  ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Active Shift';

                return (
                  <tr key={rec.id} className="hover:bg-surface-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-surface-900">
                        {empProfile.full_name || 'Team Member'}
                      </div>
                      <div className="text-[11px] text-surface-500">
                        {empProfile.employee_id || 'EMP'} • {empProfile.department || 'Engineering'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-surface-900">
                      {formatDate(rec.date)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-emerald-700 font-semibold">
                      {checkInFormatted}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-surface-600">
                      {checkOutFormatted}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <Badge
                        variant={rec.status === 'PRESENT' ? 'success' : 'neutral'}
                        size="sm"
                        className="capitalize"
                      >
                        {rec.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
