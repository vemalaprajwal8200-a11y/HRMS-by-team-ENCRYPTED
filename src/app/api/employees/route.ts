import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Employee provisioning is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const fullName = String(body.full_name || `${body.first_name || ''} ${body.last_name || ''}`).trim();
  const email = String(body.email || '').trim().toLowerCase();
  const department = String(body.department || 'General').trim();
  const jobTitle = String(body.job_title || 'Software Engineer').trim();
  const phone = String(body.phone || '').trim();
  const employeeRole = body.role === 'admin' ? 'admin' : 'employee';
  const joiningDate = String(body.joining_date || new Date().toISOString().slice(0, 10));
  if (!fullName || !email || !/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) return NextResponse.json({ error: 'Name, email, and a valid joining date are required.' }, { status: 400 });
  const names = fullName.split(/\s+/);
  const first = (names[0] || 'EM').slice(0, 2).toUpperCase();
  const last = (names[names.length - 1] || names[0] || 'PL').slice(0, 2).toUpperCase();
  const company = String(body.company_name || 'Dayflow');
  const initials = company.split(/\s+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 3).toUpperCase() || 'DF';
  const year = joiningDate.slice(0, 4);
  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { count } = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).gte('date_of_joining', `${year}-01-01`).lte('date_of_joining', `${year}-12-31`);
  const serial = String((count || 0) + 1).padStart(4, '0');
  const employeeId = `${initials}${first}${last}${year}${serial}`;
  const password = `${first.toLowerCase()}${year}!${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: created, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { employee_id: employeeId, full_name: fullName, role: employeeRole, department, date_of_joining: joiningDate } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await adminClient.from('users').update({ must_change_password: true, company_name: company } as never).eq('id', created.user.id);
  await adminClient.from('profiles').update({ phone, designation: jobTitle, department, date_of_joining: joiningDate, role: employeeRole } as never).eq('id', created.user.id);
  await adminClient.from('payroll').upsert({ user_id: created.user.id, basic_salary: 0, allowances: 0, deductions: 0, month_wage: 0 } as never, { onConflict: 'user_id' });
  return NextResponse.json({ employee: { id: created.user.id, employeeId, email, temporaryPassword: password } }, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: viewer } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((viewer as { role?: string } | null)?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (params.get('department')) query = query.eq('department', params.get('department') as never);
  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: attendance }, { data: leave }] = await Promise.all([
    supabase.from('attendance').select('user_id,check_in,check_out,status,source').eq('date', today),
    supabase.from('leave_requests').select('user_id,start_date,end_date').eq('status', 'APPROVED').lte('start_date', today).gte('end_date', today),
  ]);
  const attendanceRows = (attendance ?? []) as Array<{ user_id: string; check_in: string | null; check_out: string | null; status: string; source: string }>;
  const leaveRows = (leave ?? []) as Array<{ user_id: string; start_date: string; end_date: string }>;
  const attendanceByUser = new Map(attendanceRows.map((row) => [row.user_id, row]));
  const leaveUsers = new Set(leaveRows.map((row) => row.user_id));
  const profileRows = (profiles ?? []) as Array<{ id: string; [key: string]: unknown }>;
  const employees = profileRows.map((profile) => {
    const row = attendanceByUser.get(profile.id);
    const status = leaveUsers.has(profile.id) || row?.status === 'LEAVE' ? 'LEAVE' : row?.check_in ? 'PRESENT' : 'ABSENT';
    return { ...profile, attendance_status: status };
  });
  return NextResponse.json({ employees });
}