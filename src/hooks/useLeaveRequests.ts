'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toDateStr } from '@/lib/attendance/status';
import type { LeaveRequest, LeaveType } from '@/types/leave';

interface UseLeaveRequestsResult {
  requests: LeaveRequest[];
  isLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  apply: (input: { type: LeaveType; startDate: string; endDate: string; remarks?: string }) => Promise<void>;
  refetch: () => Promise<void>;
}

function buildDemoRequests(): LeaveRequest[] {
  const today = new Date();
  const last = new Date(today);
  last.setDate(today.getDate() - 10);
  const fmt = (d: Date) => toDateStr(d);
  return [
    {
      id: 'demo-lv-1',
      userId: 'mock-user-123',
      type: 'sick',
      startDate: fmt(last),
      endDate: fmt(last),
      remarks: 'Fever, taking a day off.',
      status: 'approved',
      reviewedBy: 'admin-1',
      adminComment: 'Take care.',
      reviewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-lv-2',
      userId: 'mock-user-123',
      type: 'paid',
      startDate: fmt(today),
      endDate: fmt(today),
      remarks: 'Personal work.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function useLeaveRequests(): UseLeaveRequestsResult {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!configured) {
      setRequests(buildDemoRequests());
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/leave-requests/me', { method: 'GET' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load leave requests.');
        setRequests([]);
      } else {
        setRequests((json.records as LeaveRequest[]) || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const apply = useCallback(
    async (input: { type: LeaveType; startDate: string; endDate: string; remarks?: string }) => {
      setActionLoading(true);
      setError(null);
      if (!configured) {
        const newReq: LeaveRequest = {
          id: 'demo-lv-' + Date.now(),
          userId: 'mock-user-123',
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          remarks: input.remarks || null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        setRequests((prev) => [newReq, ...prev]);
        setActionLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/leave-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to apply for leave.');
        } else {
          await fetchRequests();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply for leave.');
      } finally {
        setActionLoading(false);
      }
    },
    [configured, fetchRequests]
  );

  return { requests, isLoading, actionLoading, error, apply, refetch: fetchRequests };
}
