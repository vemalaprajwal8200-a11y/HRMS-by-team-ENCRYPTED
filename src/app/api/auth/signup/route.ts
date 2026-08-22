import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  let body: {
    employeeId?: string;
    companyName?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    role?: 'employee' | 'admin';
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid signup request.' }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim().toUpperCase();
  const companyName = body.companyName?.trim();
  const fullName = body.fullName?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = 'admin';

  if (!companyName || companyName.length < 2 || !employeeId || employeeId.length < 3 || !fullName || fullName.length < 2 || !phone || !email || !isValidPassword(body.password ?? '')) {
    return NextResponse.json(
      { error: 'Employee ID, full name, email, and a valid password are required.' },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: body.password as string,
    options: {
      data: { employee_id: employeeId, company_name: companyName, full_name: fullName, phone, role },
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ unconfirmedUser: !data.session && !data.user?.email_confirmed_at });
}