import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { toDateStr } from '@/lib/attendance/status';
import type { LeaveType } from '@/types/leave';

const LEAVE_TYPES: LeaveType[] = ['paid', 'sick', 'unpaid'];

// POST /api/leave-requests  — Employee applies for leave (own user only)
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { type?: string; start_date?: string; end_date?: string; remarks?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const type = body.type;
  const startDate = body.start_date;
  const endDate = body.end_date;
  const remarks = body.remarks ?? null;

  if (!type || !LEAVE_TYPES.includes(type as LeaveType)) {
    return NextResponse.json({ error: 'Invalid or missing leave type.' }, { status: 400 });
  }
  if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: 'start_date and end_date are required (YYYY-MM-DD).' }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'end_date cannot be before start_date.' }, { status: 400 });
  }
  const today = toDateStr(new Date());
  if (startDate < today) {
    return NextResponse.json({ error: 'Cannot apply for leave in the past.' }, { status: 400 });
  }

  // No overlapping PENDING or APPROVED request for the same user covering these dates.
  const { data: userRequests, error: ovErr } = await supabase
    .from('leave_requests')
    .select('id, start_date, end_date, status')
    .eq('user_id', user.id);

  if (ovErr) {
    return NextResponse.json({ error: ovErr.message }, { status: 500 });
  }
  const overlaps = (userRequests || []).filter(
    (r) =>
      (r.status === 'pending' || r.status === 'approved') &&
      r.start_date <= endDate &&
      r.end_date >= startDate
  );
  if (overlaps.length > 0) {
    return NextResponse.json(
      { error: 'You already have a pending or approved leave request overlapping these dates.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: user.id,
      type: type as LeaveType,
      start_date: startDate,
      end_date: endDate,
      remarks,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data }, { status: 201 });
}

// GET /api/leave-requests?status=&userId=  — Admin-only list
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');

  let query = supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status as any);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve employee names (avoids typed embedded-select issues).
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, employee_id, department, designation');
  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  const records = (data || []).map((r) => ({
    ...r,
    employeeName: profileMap.get(r.user_id)?.full_name ?? null,
    employeeId: profileMap.get(r.user_id)?.employee_id ?? null,
    department: profileMap.get(r.user_id)?.department ?? null,
  }));

  return NextResponse.json({ records });
}
