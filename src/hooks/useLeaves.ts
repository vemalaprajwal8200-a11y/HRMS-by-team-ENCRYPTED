'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LeaveRequest, LeaveType, LeaveStatus, LeaveBalance } from '@/types/leave';

export function useLeaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const fetchLeaves = useCallback(async () => {
    if (!user || !configured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase.from('leave_requests') as any)
        .select(`
          id,
          user_id,
          type,
          start_date,
          end_date,
          remarks,
          status,
          reviewed_by,
          comments,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Error fetching leaves:', fetchError.message);
        setError(fetchError.message);
      } else if (data) {
        const mapped: LeaveRequest[] = (data as any[]).map((row) => {
          const start = new Date(row.start_date).getTime();
          const end = new Date(row.end_date).getTime();
          const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

          return {
            id: row.id,
            userId: row.user_id,
            type: row.type as LeaveType,
            startDate: row.start_date,
            endDate: row.end_date,
            totalDays: isNaN(diffDays) ? 1 : diffDays,
            remarks: row.remarks || undefined,
            status: row.status as LeaveStatus,
            reviewedBy: row.reviewed_by,
            comments: row.comments,
            createdAt: row.created_at,
          };
        });

        setLeaves(mapped);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load leave applications';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, configured, supabase]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const applyLeave = async (params: {
    type: LeaveType;
    startDate: string;
    endDate: string;
    remarks?: string;
  }) => {
    if (!user || !configured) return { error: new Error('User not authenticated') };

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: insertError } = await (supabase.from('leave_requests') as any)
        .insert({
          user_id: user.id,
          type: params.type,
          start_date: params.startDate,
          end_date: params.endDate,
          remarks: params.remarks?.trim() || null,
          status: 'PENDING',
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return { error: insertError };
      }

      await fetchLeaves();
      return { error: null, data };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Failed to submit leave request');
      setError(e.message);
      return { error: e };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Balance calculation (Quota: Casual: 12, Sick: 10, Paid: 15)
  const approvedCasual = leaves
    .filter((l) => l.type === 'UNPAID' && l.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.totalDays, 0);

  const approvedSick = leaves
    .filter((l) => l.type === 'SICK' && l.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.totalDays, 0);

  const approvedPaid = leaves
    .filter((l) => l.type === 'PAID' && l.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.totalDays, 0);

  const balances: LeaveBalance = {
    casual: Math.max(0, 12 - approvedCasual),
    sick: Math.max(0, 10 - approvedSick),
    paid: Math.max(0, 15 - approvedPaid),
  };

  return {
    leaves,
    balances,
    isLoading,
    isSubmitting,
    error,
    applyLeave,
    refetch: fetchLeaves,
  };
}

export interface AdminLeaveItem extends LeaveRequest {
  employeeName: string;
  employeeId: string;
  department: string;
}

export function useAllLeaves() {
  const { user } = useAuth();
  const [allLeaves, setAllLeaves] = useState<AdminLeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const fetchAllLeaves = useCallback(async () => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase.from('leave_requests') as any)
        .select(`
          id,
          user_id,
          type,
          start_date,
          end_date,
          remarks,
          status,
          reviewed_by,
          comments,
          created_at,
          profiles:user_id (
            id,
            full_name,
            employee_id,
            department
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Error fetching all leave requests:', fetchError.message);
        setError(fetchError.message);
      } else if (data) {
        const mapped: AdminLeaveItem[] = (data as any[]).map((row: any) => {
          const start = new Date(row.start_date).getTime();
          const end = new Date(row.end_date).getTime();
          const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
          const profile = row.profiles || {};

          return {
            id: row.id,
            userId: row.user_id,
            employeeName: profile.full_name || 'Team Member',
            employeeId: profile.employee_id || 'EMP',
            department: profile.department || 'General',
            type: row.type as LeaveType,
            startDate: row.start_date,
            endDate: row.end_date,
            totalDays: isNaN(diffDays) ? 1 : diffDays,
            remarks: row.remarks || undefined,
            status: row.status as LeaveStatus,
            reviewedBy: row.reviewed_by,
            comments: row.comments,
            createdAt: row.created_at,
          };
        });

        setAllLeaves(mapped);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load requests';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [configured, supabase]);

  useEffect(() => {
    fetchAllLeaves();
  }, [fetchAllLeaves]);

  const reviewLeave = async (
    leaveId: string,
    action: 'APPROVED' | 'REJECTED',
    comments?: string
  ) => {
    if (!user || !configured) return { error: new Error('Unauthorized') };

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: updateError } = await (supabase.from('leave_requests') as any)
        .update({
          status: action,
          reviewed_by: user.id,
          comments: comments?.trim() || null,
        })
        .eq('id', leaveId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return { error: updateError };
      }

      await fetchAllLeaves();
      return { error: null, data };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Review failed');
      setError(e.message);
      return { error: e };
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = allLeaves.filter((l) => l.status === 'PENDING').length;

  return {
    allLeaves,
    pendingCount,
    isLoading,
    isSubmitting,
    error,
    reviewLeave,
    refetch: fetchAllLeaves,
  };
}
