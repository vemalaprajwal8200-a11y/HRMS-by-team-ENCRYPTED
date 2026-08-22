import { NextResponse } from 'next/server';
import { requireUser, utcDateString, type AttendanceRow } from '../_auth';

export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const date = utcDateString();
  const { data: rawExisting } = await auth.supabase
    .from('attendance')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('date', date)
    .maybeSingle();
  const existing = rawExisting as AttendanceRow | null;

  if (existing?.check_in) {
    return NextResponse.json({ error: 'You are already checked in today.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from('attendance')
    .upsert({ user_id: auth.user.id, date, check_in: now, status: 'PRESENT', source: 'AUTO' } as never, { onConflict: 'user_id,date' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ record: data });
}