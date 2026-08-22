import { NextResponse } from 'next/server';
import { requireUser, dateOnly, type LeaveRow } from './_auth';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  let query = auth.supabase.from('leave_requests').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
  if (auth.role === 'admin') query = auth.supabase.from('leave_requests').select('*, profiles!inner(full_name, employee_id)').order('status', { ascending: true }).order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) {
    const staleSchema = error.message.includes('leave_requests_status_check');
    return NextResponse.json({ error: staleSchema ? 'The database needs the Phase 4 migration. Apply supabase/migrations/0003_leave_workflow.sql, then try again.' : error.message }, { status: 400 });
  }
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const type = body.type as 'PAID' | 'SICK' | 'UNPAID';
  const startDate = String(body.start_date || '');
  const endDate = String(body.end_date || '');
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if (!['PAID', 'SICK', 'UNPAID'].includes(type) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || dateOnly(endDate) < dateOnly(startDate) || dateOnly(startDate) < today) {
    return NextResponse.json({ error: 'Choose a valid leave type and dates that are today or later.' }, { status: 400 });
  }
  const { data: existing } = await auth.supabase.from('leave_requests').select('start_date,end_date').eq('user_id', auth.user.id).in('status', ['PENDING', 'APPROVED']);
  const overlap = ((existing ?? []) as Array<{ start_date: string; end_date: string }>).some((row) => dateOnly(startDate) <= dateOnly(row.end_date) && dateOnly(endDate) >= dateOnly(row.start_date));
  if (overlap) return NextResponse.json({ error: 'This leave overlaps an existing pending or approved request.' }, { status: 409 });
  const { data, error } = await auth.supabase.from('leave_requests').insert({ user_id: auth.user.id, type, start_date: startDate, end_date: endDate, remarks: body.remarks?.trim() || null, status: 'PENDING' } as never).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ request: data }, { status: 201 });
}