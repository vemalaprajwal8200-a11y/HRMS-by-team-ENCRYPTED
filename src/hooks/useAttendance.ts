'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  deriveAttendanceStatus,
  getWeekRange,
  toDateStr,
  fillAbsentDays,
  type AttendanceStatus,
} from '@/lib/attendance/status';
import type { AttendanceRecord } from '@/types/attendance';

export type AttendanceRange = 'daily' | 'weekly';

interface UseAttendanceResult {
  range: AttendanceRange;
  setRange: (r: AttendanceRange) => void;
  records: AttendanceRecord[];
  today: AttendanceRecord | null;
  isLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

// --- Demo fallback (used when Supabase env is not configured) -----------------
function buildDemoRecords(): AttendanceRecord[] {
  const { start, end } = getWeekRange();
  const seed: { date: string; status: AttendanceStatus; checkIn: string | null; checkOut: string | null }[] = [
    { date: start, status: 'present', checkIn: `${start}T09:05:00`, checkOut: `${start}T18:00:00` },
    { date: toDateStr(new Date(new Date(start + 'T00:00:00').getTime() + 86400000)), status: 'half_day', checkIn: `${start}T11:42:00`, checkOut: `${start}T18:00:00` },
  ];
  const view = fillAbsentDays(seed, start, end);
  return view.map((v) => {
    const real = seed.find((s) => s.date === v.date);
    if (real) {
      return {
        id: 'demo-' + real.date,
        userId: 'mock-user-123',
        date: real.date,
        checkIn: real.checkIn,
        checkOut: real.checkOut,
        status: real.status,
        source: 'auto',
        synthesized: false,
      };
    }
    return {
      id: null,
      userId: 'mock-user-123',
      date: v.date,
      checkIn: null,
      checkOut: null,
      status: v.status,
      source: 'auto',
      synthesized: true,
    };
  });
}

function demoToday(): AttendanceRecord {
  const today = toDateStr(new Date());
  return {
    id: null,
    userId: 'mock-user-123',
    date: today,
    checkIn: null,
    checkOut: null,
    status: 'absent',
    source: 'auto',
    synthesized: true,
  };
}

// -----------------------------------------------------------------------------

export function useAttendance(initialRange: AttendanceRange = 'daily'): UseAttendanceResult {
  const [range, setRange] = useState<AttendanceRange>(initialRange);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!configured) {
      setRecords(range === 'weekly' ? buildDemoRecords() : [demoToday()]);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecords([]);
        setIsLoading(false);
        return;
      }
      const res = await fetch(`/api/attendance/me?range=${range}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load attendance.');
        setRecords([]);
      } else {
        setRecords(json.records as AttendanceRecord[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setIsLoading(false);
    }
  }, [configured, range]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const checkIn = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    const nowIso = new Date().toISOString();

    if (!configured) {
      // Optimistic local update exercising the real derivation function.
      setRecords((prev) =>
        prev.map((r) =>
          r.date === toDateStr(new Date())
            ? { ...r, checkIn: nowIso, checkOut: null, status: 'present', source: 'auto', synthesized: false }
            : r
        )
      );
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/attendance/check-in', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Check-in failed.');
      } else {
        await fetchRecords();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  }, [configured, fetchRecords]);

  const checkOut = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    const nowIso = new Date().toISOString();

    if (!configured) {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.date !== toDateStr(new Date()) || !r.checkIn) return r;
          const status = deriveAttendanceStatus({
            checkIn: r.checkIn,
            checkOut: nowIso,
            status: r.status,
          });
          return { ...r, checkOut: nowIso, status, source: 'auto' };
        })
      );
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/attendance/check-out', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Check-out failed.');
      } else {
        await fetchRecords();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  }, [configured, fetchRecords]);

  const today = useMemo<AttendanceRecord | null>(() => {
    const todayStr = toDateStr(new Date());
    return records.find((r) => r.date === todayStr) || null;
  }, [records]);

  return {
    range,
    setRange,
    records,
    today,
    isLoading,
    actionLoading,
    error,
    checkIn,
    checkOut,
    refetch: fetchRecords,
  };
}
