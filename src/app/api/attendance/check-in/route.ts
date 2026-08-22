import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { toDateStr } from '@/lib/attendance/status';

// POST /api/attendance/check-in
// Creates today's attendance record (if missing) and stamps check_in = now().
// Rejects if the employee already checked in today. Server-side ownership is
// enforced by RLS (auth.uid() = user_id) AND by scoping every query to user.id.
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

  // Already checked in today -> reject.
  if (existing && existing.check_in) {
    return NextResponse.json(
      { error: 'Already checked in today.', record: existing },
      { status: 409 }
    );
  }

  // Record exists but check_in is null (e.g. leave_sync placeholder) -> set it.
  if (existing) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_in: new Date().toISOString(),
        source: 'auto',
        status: 'present',
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ record: data }, { status: 200 });
  }

  // Fresh record for today.
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: user.id,
      date: today,
      check_in: new Date().toISOString(),
      status: 'present',
      source: 'auto',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data }, { status: 201 });
}
