import { NextResponse } from 'next/server';
import { requireUser } from './_auth';

export async function GET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  let query = auth.supabase.from('payroll').select('id,user_id,basic_salary,allowances,deductions,updated_at,updated_by,profiles!inner(full_name,employee_id,department)').order('updated_at', { ascending: false });
  if (params.get('userId')) query = query.eq('user_id', params.get('userId') as never);
  if (params.get('department')) query = query.eq('profiles.department', params.get('department') as never);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ payroll: data ?? [] });
}