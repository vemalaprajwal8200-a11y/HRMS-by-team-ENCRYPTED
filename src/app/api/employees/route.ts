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
  const fullName = String(body.full_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const department = String(body.department || 'General').trim();
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
  const { data: created, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { employee_id: employeeId, full_name: fullName, role: 'employee', department, date_of_joining: joiningDate } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ employee: { id: created.user.id, employeeId, email, temporaryPassword: password } }, { status: 201 });
}