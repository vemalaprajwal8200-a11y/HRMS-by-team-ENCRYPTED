import { NextResponse } from 'next/server';
import { requireUser } from '../_auth';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('payroll').select('id,user_id,basic_salary,allowances,deductions,updated_at,updated_by').eq('user_id', auth.user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ payroll: data });
}