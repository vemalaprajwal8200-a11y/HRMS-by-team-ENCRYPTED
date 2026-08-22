'use client';

import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { LeaveStatus, LeaveType } from '@/types/leave';

export interface AdminLeaveRow {
  id: string;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  remarks: string | null;
  status: LeaveStatus;
  admin_comment: string | null;
  employeeName?: string | null;
  employeeId?: string | null;
  department?: string | null;
}

const STATUS_BADGE: Record<LeaveStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

function formatDateLabel(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
      new Date(dateStr + 'T00:00:00')
    );
  } catch {
    return dateStr;
  }
}

interface AdminLeaveTableProps {
  rows: AdminLeaveRow[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onDecision: (id: string, status: 'approved' | 'rejected', comment: string) => Promise<void>;
  decidingId: string | null;
}

export function AdminLeaveTable({
  rows,
  isLoading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onDecision,
  decidingId,
}: AdminLeaveTableProps) {
  const [comments, setComments] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-subtle"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                <th className="py-3 px-4 sm:px-6">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">HR Comment & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-500">
                    <Clock className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                    <p className="font-medium text-sm text-surface-700">No leave requests found</p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const badge = STATUS_BADGE[r.status];
                  const isPending = r.status === 'pending';
                  return (
                    <tr key={r.id} className="hover:bg-surface-50/70 transition-colors align-top">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-surface-900">{r.employeeName || 'Unknown'}</div>
                        <div className="text-xs text-surface-500 font-mono">{r.employeeId || r.user_id.slice(0, 8)}</div>
                        {r.department && <div className="text-[11px] text-surface-400 mt-0.5">{r.department}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-surface-600 capitalize">{r.type} leave</td>
                      <td className="py-3.5 px-4 text-surface-600">
                        {formatDateLabel(r.start_date)}
                        {r.end_date !== r.start_date ? ` – ${formatDateLabel(r.end_date)}` : ''}
                        {r.remarks && <div className="text-[11px] text-surface-400 mt-0.5 max-w-[200px] truncate">{r.remarks}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {!isPending ? (
                          <span className="text-[11px] text-surface-400">
                            {r.admin_comment ? `“${r.admin_comment}”` : 'No comment'}
                          </span>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Optional comment..."
                              value={comments[r.id] || ''}
                              onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
                              className="w-full rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                isLoading={decidingId === r.id}
                                onClick={() => onDecision(r.id, 'approved', comments[r.id] || '')}
                                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                isLoading={decidingId === r.id}
                                onClick={() => onDecision(r.id, 'rejected', comments[r.id] || '')}
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
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
