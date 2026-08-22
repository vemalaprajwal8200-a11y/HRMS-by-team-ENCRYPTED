'use client';

import React from 'react';
import { Search, Building, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { AttendanceStatus } from '@/lib/attendance/status';

export interface AdminAttendanceRow {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  source: 'auto' | 'leave_sync';
  profile?: {
    full_name: string | null;
    employee_id: string | null;
    department: string | null;
    designation: string | null;
  } | null;
}

const STATUS_BADGE: Record<AttendanceStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'primary'; label: string }> = {
  present: { variant: 'success', label: 'Present' },
  half_day: { variant: 'warning', label: 'Half Day' },
  absent: { variant: 'danger', label: 'Absent' },
  leave: { variant: 'primary', label: 'Leave' },
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function formatDateLabel(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(dateStr + 'T00:00:00'));
  } catch {
    return dateStr;
  }
}

interface AdminAttendanceTableProps {
  rows: AdminAttendanceRow[];
  employees: { id: string; fullName: string; employeeId: string; department: string }[];
  isLoading: boolean;
  departments: string[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (v: string) => void;
}

export function AdminAttendanceTable({
  rows,
  isLoading,
  departments,
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
}: AdminAttendanceTableProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by employee name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-surface-200 bg-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-subtle"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-surface-400 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-subtle"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                <th className="py-3 px-4 sm:px-6">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <TableSkeleton rows={6} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-500">
                    <CalendarCheck className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                    <p className="font-medium text-sm text-surface-700">No attendance records found</p>
                    <p className="text-xs text-surface-400 mt-0.5">Adjust the date or filters above.</p>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const badge = STATUS_BADGE[r.status];
                  const name = r.profile?.full_name || 'Unknown';
                  return (
                    <tr key={r.id + '-' + i} className="hover:bg-surface-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-surface-900">{name}</div>
                        <div className="text-xs text-surface-500 font-mono">
                          {r.profile?.employee_id || r.user_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-surface-600">{r.profile?.department || '—'}</td>
                      <td className="py-3.5 px-4 text-surface-600">{formatDateLabel(r.date)}</td>
                      <td className="py-3.5 px-4 text-surface-600">{formatTime(r.check_in)}</td>
                      <td className="py-3.5 px-4 text-surface-600">{formatTime(r.check_out)}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-surface-400 text-[11px]">
                        {r.source === 'leave_sync' ? 'Leave Sync' : 'Auto'}
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
