import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const year = Number(body.year || new Date().getFullYear());
  const values = body.balances as Record<string, unknown>;
  if (!values || !['PAID', 'SICK', 'UNPAID'].every((type) => Number.isFinite(Number(values[type])) && Number(values[type]) >= 0)) return NextResponse.json({ error: 'Each allocation must be a non-negative number.' }, { status: 400 });
  const rows = ['PAID', 'SICK', 'UNPAID'].map((leave_type) => ({ user_id: params.userId, leave_type, allocated_days: Number(values[leave_type]), year }));
  const { data, error } = await supabase.from('leave_balances').upsert(rows as never, { onConflict: 'user_id,leave_type,year' }).select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ balances: data });
}