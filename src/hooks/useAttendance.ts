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

  const todayStr = new Date().toISOString().split('T')[0];

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
        .order('date', { ascending: false });

      if (fetchError) {
        console.warn('Error loading attendance:', fetchError.message);
        setError(fetchError.message);
      } else if (data) {
        const mapped: AttendanceRecord[] = (data as any[]).map((row) => {
          let workHours = 0;
          if (row.check_in && row.check_out) {
            const start = new Date(row.check_in).getTime();
            const end = new Date(row.check_out).getTime();
            workHours = Number(((end - start) / (1000 * 60 * 60)).toFixed(1));
          }
          return {
            id: row.id,
            userId: row.user_id,
            date: row.date,
            checkIn: row.check_in,
            checkOut: row.check_out,
            status: row.status as AttendanceStatus,
            source: row.source || 'AUTO',
            workHours,
            createdAt: row.created_at,
          };
        });

        setHistory(mapped);
        const todayMatch = mapped.find((r) => r.date === todayStr) || null;
        setTodayRecord(todayMatch);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load attendance';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, configured, supabase, todayStr]);

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
          status: 'PRESENT',
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
    if (!user || !configured || !todayRecord) return { error: new Error('No active check-in found') };

    setIsSubmitting(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      const { data, error: updateError } = await (supabase.from('attendance') as any)
        .update({
          check_out: nowIso,
        })
        .eq('id', todayRecord.id)
        .select()
        .single();

      if (updateError) {
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
  const presentDays = history.filter((h) => h.status === 'PRESENT').length;
  const halfDays = history.filter((h) => h.status === 'HALF_DAY').length;
  const leaveDays = history.filter((h) => h.status === 'LEAVE').length;
  const totalWorkingDays = Math.max(history.length, 1);
  const attendancePercentage = Math.round(((presentDays + halfDays * 0.5) / totalWorkingDays) * 100) || 100;

  const summary: AttendanceSummary = {
    presentDays,
    absentDays: history.filter((h) => h.status === 'ABSENT').length,
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
  const { role } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const fetchAll = useCallback(async () => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('attendance')
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
        .limit(100);

      if (fetchError) {
        console.warn('Error fetching all attendance:', fetchError.message);
        setError(fetchError.message);
      } else if (data) {
        setAttendance(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance records';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [configured, supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    attendance,
    isLoading,
    error,
    refetch: fetchAll,
  };
}
