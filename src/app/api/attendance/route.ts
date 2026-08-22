import { NextResponse } from 'next/server';
import { deriveAttendanceStatus } from '@/lib/attendance/status';
import { requireUser, type AttendanceRow } from './_auth';

type AdminAttendanceRow = AttendanceRow & {
  profiles: { full_name: string; employee_id: string; department: string | null };
};

export async function GET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const params = new URL(request.url).searchParams;
  let query = auth.supabase.from('attendance').select('*, profiles!inner(full_name, employee_id, department)').order('date', { ascending: false });
  if (params.get('date')) query = query.eq('date', params.get('date') as string);
  if (params.get('userId')) query = query.eq('user_id', params.get('userId') as string);
  if (params.get('department')) query = query.eq('profiles.department', params.get('department') as string);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const records = (data ?? []) as AdminAttendanceRow[];
  return NextResponse.json({ records: records.map((record) => ({ ...record, status: deriveAttendanceStatus(record) })) });
}