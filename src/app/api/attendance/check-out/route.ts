import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { toDateStr, deriveAttendanceStatus } from '@/lib/attendance/status';

// POST /api/attendance/check-out
// Stamps check_out = now() on today's record, then auto-derives & persists the
// status. Rejects if not checked in yet, or already checked out.
export async function POST() {
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

  const today = toDateStr(new Date());

  const { data: existing, error: selErr } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  // Not checked in yet.
  if (!existing || !existing.check_in) {
    return NextResponse.json({ error: 'You must check in before checking out.' }, { status: 400 });
  }

  // Already checked out.
  if (existing.check_out) {
    return NextResponse.json(
      { error: 'Already checked out today.', record: existing },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();

  // Auto-derive status using the isolated, Phase-4-reusable function.
  const status = deriveAttendanceStatus({
    checkIn: existing.check_in,
    checkOut: nowIso,
    status: existing.status,
    source: existing.source,
  });

  const { data, error } = await supabase
    .from('attendance')
    .update({ check_out: nowIso, status, source: 'auto' })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data }, { status: 200 });
}
