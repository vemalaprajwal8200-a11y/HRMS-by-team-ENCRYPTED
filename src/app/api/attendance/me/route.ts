import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  toDateStr,
  getWeekRange,
  deriveAttendanceStatus,
  fillAbsentDays,
  type AttendanceStatus,
} from '@/lib/attendance/status';
import type { AttendanceRecord } from '@/types/attendance';

// GET /api/attendance/me?range=daily|weekly
// Employee's OWN records only. `range=daily` -> today, `range=weekly` -> this
// week (Mon–Sun). Ownership is enforced by scoping every query to user.id
// (defense in depth on top of RLS), so even if a client passes another userId
// it is ignored.
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') === 'weekly' ? 'weekly' : 'daily';

  const todayStr = toDateStr(new Date());
  const { start, end } = range === 'weekly' ? getWeekRange() : { start: todayStr, end: todayStr };

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id) // <-- ownership enforced here, never from client input
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Lazy "compute on read": re-derive status so a not-yet-checked-out record
  // correctly shows HALF_DAY, while LEAVE (Phase 4) is preserved.
  const realRecords: AttendanceRecord[] = (data || []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: deriveAttendanceStatus({
      checkIn: r.check_in,
      checkOut: r.check_out,
      status: r.status,
      source: r.source,
    }),
    source: r.source,
    createdAt: r.created_at,
    synthesized: false,
  }));

  const realByDate = new Map(realRecords.map((r) => [r.date, r]));

  // Synthesize ABSENT for any working day in range with no real record.
  const view = fillAbsentDays(realRecords, start, end);
  const records: AttendanceRecord[] = view.map((v) => {
    const real = realByDate.get(v.date);
    if (real) return real;
    return {
      id: null,
      userId: user.id,
      date: v.date,
      checkIn: null,
      checkOut: null,
      status: v.status as AttendanceStatus,
      source: 'auto',
      synthesized: true,
    };
  });

  return NextResponse.json({ range, start, end, records });
}
