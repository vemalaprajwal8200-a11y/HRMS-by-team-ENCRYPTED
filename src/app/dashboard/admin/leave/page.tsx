'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ArrowLeft, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEmployees } from '@/hooks/useEmployees';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { AdminLeaveRow } from '@/components/dashboard/AdminLeaveTable';
import { AdminLeaveTable } from '@/components/dashboard/AdminLeaveTable';
import type { LeaveStatus, LeaveType } from '@/types/leave';

function buildDemoRows(employees: { id: string; fullName: string; employeeId: string; department: string }[]): AdminLeaveRow[] {
  const types: LeaveType[] = ['paid', 'sick', 'unpaid'];
  const statuses: LeaveStatus[] = ['pending', 'pending', 'approved', 'rejected'];
  const today = new Date();
  return employees.map((emp, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 2);
    const ds = d.toISOString().split('T')[0];
    return {
      id: 'demo-lv-' + emp.id,
      user_id: emp.id,
      type: types[i % types.length],
      start_date: ds,
      end_date: ds,
      remarks: i % 2 === 0 ? 'Family event.' : null,
      status: statuses[i % statuses.length],
      admin_comment: statuses[i % statuses.length] === 'rejected' ? 'Insufficient balance.' : null,
      employeeName: emp.fullName,
      employeeId: emp.employeeId,
      department: emp.department,
    };
  });
}

export default function AdminLeavePage() {
  const { employees } = useEmployees();
  const configured = isSupabaseConfigured();

  const [rows, setRows] = useState<AdminLeaveRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!configured) {
      setRows(buildDemoRows(employees));
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/leave-requests', { method: 'GET' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load leave requests.');
        setRows([]);
      } else {
        setRows((json.records as AdminLeaveRow[]) || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, [configured, employees]);

  useEffect(() => {
    load();
  }, [load]);

  const onDecision = useCallback(
    async (id: string, status: 'approved' | 'rejected', comment: string) => {
      setDecidingId(id);
      setError(null);
      try {
        const res = await fetch(`/api/leave-requests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, admin_comment: comment }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to update request.');
        } else {
          await load();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update request.');
      } finally {
        setDecidingId(null);
      }
    },
    [load]
  );

  // Filter + pending-first ordering for demo clarity.
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const list = rows.filter((r) => {
      const name = (r.employeeName || '').toLowerCase();
      const eid = (r.employeeId || '').toLowerCase();
      const matchesSearch = !term || name.includes(term) || eid.includes(term);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const order: Record<LeaveStatus, number> = { pending: 0, approved: 1, rejected: 2 };
    return [...list].sort((a, b) => order[a.status] - order[b.status]);
  }, [rows, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-500 hover:text-surface-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-600" /> Leave Approvals
          </h1>
          <p className="text-sm text-surface-600 mt-1">
            Review and decide on employee leave requests. Approving syncs leave into Attendance.
          </p>
        </div>
        <Badge variant="primary" size="md">
          Phase 4 Live
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <Users className="w-4 h-4" /> {filtered.length} requests
        </div>
        <Button variant="ghost" size="sm" onClick={load} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <AdminLeaveTable
        rows={filtered}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onDecision={onDecision}
        decidingId={decidingId}
      />
    </div>
  );
}
