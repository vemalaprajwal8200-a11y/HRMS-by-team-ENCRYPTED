import { NextResponse } from 'next/server';
import { deriveAttendanceStatus } from '@/lib/attendance/status';
import { requireUser, utcDateString, type AttendanceRow } from '../_auth';

export async function GET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const range = new URL(request.url).searchParams.get('range') === 'weekly' ? 'weekly' : 'daily';
  const end = new Date();
  const start = new Date(end);
  if (range === 'weekly') start.setUTCDate(start.getUTCDate() - 6);

  const { data, error } = await auth.supabase
    .from('attendance')
    .select('*')
    .eq('user_id', auth.user.id)
    .gte('date', utcDateString(start))
    .lte('date', utcDateString(end))
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const rows = (data ?? []) as AttendanceRow[];
  const byDate = new Map(rows.map((record) => [record.date, record]));
  const records = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = utcDateString(cursor);
    const record = byDate.get(date) ?? {
      id: `absent-${date}`,
      user_id: auth.user.id,
      date,
      check_in: null,
      check_out: null,
      status: 'ABSENT' as const,
      source: 'AUTO' as const,
      created_at: `${date}T00:00:00.000Z`,
    };
    records.unshift({ ...record, status: deriveAttendanceStatus(record) });
  }
  return NextResponse.json({ records, range });
}