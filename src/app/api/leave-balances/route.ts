import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function auth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { supabase, user, role: (profile as { role?: string } | null)?.role };
}

export async function GET(request: Request) {
  const context = await auth();
  if ('error' in context) return context.error;
  const params = new URL(request.url).searchParams;
  const target = context.role === 'admin' ? params.get('userId') : context.user.id;
  if (context.role !== 'admin' && target !== context.user.id) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  const year = Number(params.get('year') || new Date().getFullYear());
  const { data: balances, error } = await context.supabase.from('leave_balances').select('*').eq('user_id', target as string).eq('year', year);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: approved } = await context.supabase.from('leave_requests').select('type,start_date,end_date').eq('user_id', target as string).eq('status', 'APPROVED').gte('start_date', `${year}-01-01`).lte('end_date', `${year}-12-31`);
  const used = { PAID: 0, SICK: 0, UNPAID: 0 };
  const approvedRows = (approved ?? []) as Array<{ type: 'PAID' | 'SICK' | 'UNPAID'; start_date: string; end_date: string }>;
  approvedRows.forEach((request) => { const start = new Date(`${request.start_date}T00:00:00Z`); const end = new Date(`${request.end_date}T00:00:00Z`); used[request.type] += Math.floor((end.getTime() - start.getTime()) / 86400000) + 1; });
  const balanceRows = (balances ?? []) as Array<{ id: string; user_id: string; leave_type: 'PAID' | 'SICK' | 'UNPAID'; allocated_days: number; year: number }>;
  return NextResponse.json({ balances: balanceRows.map((balance) => ({ ...balance, used_days: used[balance.leave_type] || 0, available_days: Number(balance.allocated_days) - (used[balance.leave_type] || 0) })) });
}