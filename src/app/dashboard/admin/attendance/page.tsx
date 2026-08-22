'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, ArrowLeft, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEmployees } from '@/hooks/useEmployees';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { toDateStr, type AttendanceStatus } from '@/lib/attendance/status';
import { AdminAttendanceTable, type AdminAttendanceRow } from '@/components/dashboard/AdminAttendanceTable';

function buildDemoRows(
  date: string,
  employees: { id: string; fullName: string; employeeId: string; department: string }[]
): AdminAttendanceRow[] {
  const statuses: AttendanceStatus[] = ['present', 'half_day', 'absent', 'leave', 'present', 'present'];
  return employees.map((emp, i) => {
    const status = statuses[i % statuses.length];
    const hasIn = status === 'present' || status === 'half_day';
    const hasOut = status === 'present';
    return {
      id: 'demo-' + emp.id + '-' + date,
      user_id: emp.id,
      date,
      check_in: hasIn ? `${date}T09:${i % 9}0:00` : null,
      check_out: hasOut ? `${date}T18:00:00` : null,
      status,
      source: status === 'leave' ? 'leave_sync' : 'auto',
      profile: { full_name: emp.fullName, employee_id: emp.employeeId, department: emp.department, designation: '' },
    };
  });
}

export default function AdminAttendancePage() {
  const { employees, isLoading: empLoading } = useEmployees();
  const configured = isSupabaseConfigured();

  const [date, setDate] = useState<string>(toDateStr(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [rows, setRows] = useState<AdminAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return Array.from(set);
  }, [employees]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!configured) {
      setRows(buildDemoRows(date, employees));
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      const res = await fetch(`/api/attendance?${params.toString()}`, { method: 'GET' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load attendance.');
        setRows([]);
      } else {
        setRows(json.records as AdminAttendanceRow[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setIsLoading(false);
    }
  }, [configured, date, employees]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search + department filtering (reuses Phase 2 pattern).
  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      const name = (r.profile?.full_name || '').toLowerCase();
      const empId = (r.profile?.employee_id || '').toLowerCase();
      const matchesSearch = !term || name.includes(term) || empId.includes(term);
      const matchesDept = departmentFilter === 'ALL' || r.profile?.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [rows, searchTerm, departmentFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-500 hover:text-surface-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600" /> Attendance Oversight
          </h1>
          <p className="text-sm text-surface-600 mt-1">
            Organization-wide attendance records. Filter by date, employee, or department.
          </p>
        </div>
        <Badge variant="primary" size="md">
          Phase 3 Live
        </Badge>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-surface-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-subtle"
          />
        </div>
        <div className="flex items-center gap-2 text-surface-400">
          <Users className="w-4 h-4" />
          <span className="text-xs">{filteredRows.length} records</span>
        </div>
        <div className="sm:ml-auto">
          <Button variant="ghost" size="sm" onClick={load} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <AdminAttendanceTable
        rows={filteredRows}
        employees={employees}
        isLoading={isLoading || empLoading}
        departments={departments}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
      />
    </div>
  );
}
