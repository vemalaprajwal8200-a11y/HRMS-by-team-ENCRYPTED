import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { applyLeaveDecision, LeaveDecisionError } from '@/lib/attendance/syncLeave';
import type { LeaveStatus } from '@/types/leave';

// PATCH /api/leave-requests/:id — Admin-only decision (state machine enforced in DB)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin-only guard — an employee calling this gets 403 (cannot approve own/others).
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin access required.' }, { status: 403 });
  }

  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing request id.' }, { status: 400 });

  let body: { status?: string; admin_comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const status = body.status;
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: "status must be 'approved' or 'rejected'." }, { status: 400 });
  }

  try {
    const updated = await applyLeaveDecision(supabase, {
      requestId: id,
      adminId: user.id,
      status: status as Extract<LeaveStatus, 'approved' | 'rejected'>,
      adminComment: body.admin_comment ?? null,
    });
    return NextResponse.json({ request: updated }, { status: 200 });
  } catch (err) {
    if (err instanceof LeaveDecisionError) {
      const msg = err.message.toLowerCase();
      if (msg.includes('already')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      if (msg.includes('not found')) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      if (msg.includes('forbidden')) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to apply decision.' },
      { status: 500 }
    );
  }
}
