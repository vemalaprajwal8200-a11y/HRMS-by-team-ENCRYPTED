'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '@/types/attendance';

export function useAttendance() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr();
  const utcTodayStr = new Date().toISOString().split('T')[0];

  const fetchAttendance = useCallback(async () => {
    if (!user || !configured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase.from('attendance') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Error loading attendance:', fetchError.message);
        setError(fetchError.message);
      } else if (data) {
        const mapped: AttendanceRecord[] = (data as any[]).map((row) => {
          let workHours = 0;
          if (row.check_in && row.check_out) {
            const start = new Date(row.check_in).getTime();
            const end = new Date(row.check_out).getTime();
            workHours = Math.max(0.1, Number(((end - start) / (1000 * 60 * 60)).toFixed(1)));
          }
          return {
            id: row.id,
            userId: row.user_id,
            date: row.date,
            checkIn: row.check_in,
            checkOut: row.check_out,
            status: row.status as AttendanceStatus,
            workHours,
            createdAt: row.created_at,
          };
        });

        setHistory(mapped);

        // 1. First look for any active open shift (checked in, not yet checked out)
        const openShift = mapped.find((r) => r.checkIn && !r.checkOut);
        if (openShift) {
          setTodayRecord(openShift);
        } else {
          // 2. Otherwise look for today's completed shift
          const todayMatch =
            mapped.find((r) => r.date === todayStr || r.date === utcTodayStr) || null;
          setTodayRecord(todayMatch);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load attendance';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, configured, supabase, todayStr, utcTodayStr]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const clockIn = async () => {
    if (!user || !configured) return { error: new Error('User not authenticated') };

    setIsSubmitting(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      const { data, error: insertError } = await (supabase.from('attendance') as any)
        .insert({
          user_id: user.id,
          date: todayStr,
          check_in: nowIso,
          status: 'present',
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return { error: insertError };
      }

      await fetchAttendance();
      return { error: null, data };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Clock-in failed');
      setError(e.message);
      return { error: e };
    } finally {
      setIsSubmitting(false);
    }
  };

  const clockOut = async () => {
    if (!user || !configured) return { error: new Error('User not authenticated') };

    setIsSubmitting(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      let targetRecordId = todayRecord?.id;

      // If todayRecord is missing from local state, dynamically fetch the latest open record from DB
      if (!targetRecordId) {
        const { data: openRows } = await (supabase.from('attendance') as any)
          .select('id')
          .eq('user_id', user.id)
          .is('check_out', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (openRows && openRows.length > 0) {
          targetRecordId = openRows[0].id;
        } else {
          // If no open record, find the most recent record for today
          const { data: recentRows } = await (supabase.from('attendance') as any)
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentRows && recentRows.length > 0) {
            targetRecordId = recentRows[0].id;
          }
        }
      }

      if (!targetRecordId) {
        const err = new Error('No active attendance record found to clock out from');
        setError(err.message);
        return { error: err };
      }

      const { data, error: updateError } = await (supabase.from('attendance') as any)
        .update({
          check_out: nowIso,
          status: 'present',
        })
        .eq('id', targetRecordId)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase clock-out error:', updateError);
        setError(updateError.message);
        return { error: updateError };
      }

      await fetchAttendance();
      return { error: null, data };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Clock-out failed');
      setError(e.message);
      return { error: e };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate summary metrics
  const presentDays = history.filter((h) => h.status === 'present').length;
  const halfDays = history.filter((h) => h.status === 'half-day').length;
  const leaveDays = history.filter((h) => h.status === 'leave').length;
  const totalWorkingDays = Math.max(history.length, 1);
  const attendancePercentage =
    Math.round(((presentDays + halfDays * 0.5) / totalWorkingDays) * 100) || 100;

  const summary: AttendanceSummary = {
    presentDays,
    absentDays: history.filter((h) => h.status === 'absent').length,
    halfDays,
    leaveDays,
    totalWorkingDays,
    attendancePercentage,
  };

  return {
    todayRecord,
    history,
    summary,
    isLoading,
    isSubmitting,
    error,
    clockIn,
    clockOut,
    refetch: fetchAttendance,
  };
}

export function useAllAttendance() {
  const { user } = useAuth();
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const fetchAllAttendance = useCallback(async () => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase.from('attendance') as any)
        .select(`
          id,
          user_id,
          date,
          check_in,
          check_out,
          status,
          created_at,
          profiles:user_id (
            id,
            full_name,
            employee_id,
            department,
            designation
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Error fetching all attendance:', fetchError.message);
        setError(fetchError.message);
      } else if (data) {
        const mapped = (data as any[]).map((row) => {
          let workHours = 0;
          if (row.check_in && row.check_out) {
            const start = new Date(row.check_in).getTime();
            const end = new Date(row.check_out).getTime();
            workHours = Math.max(0.1, Number(((end - start) / (1000 * 60 * 60)).toFixed(1)));
          }
          const profile = row.profiles || {};

          return {
            id: row.id,
            userId: row.user_id,
            employeeName: profile.full_name || 'Team Member',
            employeeId: profile.employee_id || 'EMP',
            department: profile.department || 'General',
            designation: profile.designation || 'Staff',
            date: row.date,
            checkIn: row.check_in,
            checkOut: row.check_out,
            status: row.status,
            workHours,
            createdAt: row.created_at,
          };
        });

        setAllAttendance(mapped);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load team attendance';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [configured, supabase]);

  useEffect(() => {
    fetchAllAttendance();
  }, [fetchAllAttendance]);

  return {
    attendance: allAttendance,
    allAttendance,
    isLoading,
    error,
    refetch: fetchAllAttendance,
  };
}
