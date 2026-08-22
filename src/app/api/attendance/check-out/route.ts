import { NextResponse } from 'next/server';
import { deriveAttendanceStatus } from '@/lib/attendance/status';
import { requireUser, utcDateString, type AttendanceRow } from '../_auth';

export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const { data: rawExisting } = await auth.supabase
    .from('attendance')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('date', utcDateString())
    .maybeSingle();
  const existing = rawExisting as AttendanceRow | null;

  if (!existing?.check_in) return NextResponse.json({ error: 'Check in before checking out.' }, { status: 409 });
  if (existing.check_out) return NextResponse.json({ error: 'You are already checked out today.' }, { status: 409 });

  const checkOut = new Date().toISOString();
  const status = deriveAttendanceStatus({ ...existing, check_out: checkOut });
  const { data, error } = await auth.supabase
    .from('attendance')
    .update({ check_out: checkOut, status } as never)
    .eq('id', existing.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ record: data });
}