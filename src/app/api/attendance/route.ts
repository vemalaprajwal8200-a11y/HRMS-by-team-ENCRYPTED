import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { deriveAttendanceStatus } from '@/lib/attendance/status';

// GET /api/attendance?date=&userId=&department=
// Admin-only oversight of ALL employees' attendance. Filtered by optional date,
// userId, and/or department (department is resolved from the profiles table).
// A non-admin calling this gets a 403 regardless of any params supplied.
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side role gate — never trust the client to self-restrict.
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const userId = searchParams.get('userId');
  const department = searchParams.get('department');

  // Attendance records (date range / userId filters applied server-side).
  let query = supabase.from('attendance').select('*').order('date', { ascending: false });
  if (date) {
    query = query.eq('date', date);
  } else {
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
  }
  if (userId) query = query.eq('user_id', userId);

  const { data: attendance, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Profiles (for name / department display + department filtering).
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, employee_id, department, designation');

  const profileMap = new Map(
    (profiles || []).map((p) => [
      p.id,
      { full_name: p.full_name, employee_id: p.employee_id, department: p.department, designation: p.designation },
    ])
  );

  let records = (attendance || []).map((r) => ({
    ...r,
    status: deriveAttendanceStatus({
      checkIn: r.check_in,
      checkOut: r.check_out,
      status: r.status,
      source: r.source,
    }),
    profile: profileMap.get(r.user_id) || null,
  }));

  // Department filter (resolved from profiles).
  if (department) {
    records = records.filter((r) => r.profile?.department === department);
  }

  return NextResponse.json({ records });
}
