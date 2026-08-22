import { NextResponse } from 'next/server';
import { requireUser } from '../_auth';

function numberValue(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : Number(value); }
function amount(type: 'FIXED' | 'PERCENTAGE', value: number, base: number) { return type === 'PERCENTAGE' ? base * value / 100 : value; }

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const wage = numberValue(body.month_wage ?? body.basic_salary);
  const basicType = body.basic_salary_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const basicValue = numberValue(body.basic_salary_value ?? body.basic_salary);
  const hraType = body.hra_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const hraValue = numberValue(body.hra_value ?? 0);
  const standardType = body.standard_allowance_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const standardValue = numberValue(body.standard_allowance_value ?? body.allowances ?? 0);
  const bonusType = body.performance_bonus_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const bonusValue = numberValue(body.performance_bonus_value ?? 0);
  const ltaType = body.leave_travel_allowance_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const ltaValue = numberValue(body.leave_travel_allowance_value ?? 0);
  const basicSalary = amount(basicType, basicValue, wage);
  const hra = amount(hraType, hraValue, basicSalary);
  const standard = amount(standardType, standardValue, wage);
  const bonus = amount(bonusType, bonusValue, basicSalary);
  const lta = amount(ltaType, ltaValue, basicSalary);
  const allowances = hra + standard + bonus + lta;
  const deductions = numberValue(body.deductions ?? body.professional_tax ?? 0);
  if (!Number.isFinite(basicSalary) || basicSalary <= 0) return NextResponse.json({ error: 'Basic salary must be greater than 0.' }, { status: 400 });
  if (!Number.isFinite(allowances) || allowances < 0) return NextResponse.json({ error: 'Allowances cannot be negative.' }, { status: 400 });
  if (!Number.isFinite(deductions) || deductions < 0) return NextResponse.json({ error: 'Deductions cannot be negative.' }, { status: 400 });
  if (deductions > basicSalary + allowances) return NextResponse.json({ error: 'Deductions cannot exceed basic salary plus allowances.' }, { status: 400 });
  if (basicSalary + allowances > wage) return NextResponse.json({ error: 'Salary components cannot exceed the monthly wage.' }, { status: 400 });
  const fixedAllowance = wage - (basicSalary + allowances);
  const payload = { user_id: params.userId, basic_salary: basicSalary, allowances, deductions, month_wage: wage, working_days_per_week: numberValue(body.working_days_per_week ?? 5), break_time_hours: numberValue(body.break_time_hours ?? 1), basic_salary_type: basicType, basic_salary_value: basicValue, hra_type: hraType, hra_value: hraValue, standard_allowance_type: standardType, standard_allowance_value: standardValue, performance_bonus_type: bonusType, performance_bonus_value: bonusValue, leave_travel_allowance_type: ltaType, leave_travel_allowance_value: ltaValue, pf_employee_percent: numberValue(body.pf_employee_percent ?? 0), pf_employer_percent: numberValue(body.pf_employer_percent ?? 0), professional_tax: numberValue(body.professional_tax ?? 0), updated_by: auth.user.id, updated_at: new Date().toISOString() };
  const { data, error } = await auth.supabase.from('payroll').upsert(payload as never, { onConflict: 'user_id' }).select('id,user_id,basic_salary,allowances,deductions,updated_at,updated_by').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const saved = data as { id: string; user_id: string; basic_salary: number; allowances: number; deductions: number; updated_at: string; updated_by: string | null };
  return NextResponse.json({ payroll: { ...saved, fixed_allowance: fixedAllowance, amounts: { basic_salary: basicSalary, hra, standard_allowance: standard, performance_bonus: bonus, leave_travel_allowance: lta, fixed_allowance: fixedAllowance } } });
}