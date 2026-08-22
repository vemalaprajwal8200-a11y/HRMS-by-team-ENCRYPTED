import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  let body: {
    employeeId?: string;
    fullName?: string;
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
  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = body.role === 'admin' ? 'admin' : 'employee';

  if (!employeeId || employeeId.length < 3 || !fullName || fullName.length < 2 || !email || !isValidPassword(body.password ?? '')) {
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
      data: { employee_id: employeeId, full_name: fullName, role },
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ unconfirmedUser: !data.session && !data.user?.email_confirmed_at });
}