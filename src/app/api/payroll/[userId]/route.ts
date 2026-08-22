import { NextResponse } from 'next/server';
import { requireUser } from '../_auth';

function numberValue(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : Number(value); }

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const basicSalary = numberValue(body.basic_salary);
  const allowances = numberValue(body.allowances);
  const deductions = numberValue(body.deductions);
  if (!Number.isFinite(basicSalary) || basicSalary <= 0) return NextResponse.json({ error: 'Basic salary must be greater than 0.' }, { status: 400 });
  if (!Number.isFinite(allowances) || allowances < 0) return NextResponse.json({ error: 'Allowances cannot be negative.' }, { status: 400 });
  if (!Number.isFinite(deductions) || deductions < 0) return NextResponse.json({ error: 'Deductions cannot be negative.' }, { status: 400 });
  if (deductions > basicSalary + allowances) return NextResponse.json({ error: 'Deductions cannot exceed basic salary plus allowances.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('payroll').upsert({ user_id: params.userId, basic_salary: basicSalary, allowances, deductions, updated_by: auth.user.id, updated_at: new Date().toISOString() } as never, { onConflict: 'user_id' }).select('id,user_id,basic_salary,allowances,deductions,updated_at,updated_by').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ payroll: data });
}