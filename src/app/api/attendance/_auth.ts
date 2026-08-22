import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AttendanceRow = {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  source: 'AUTO' | 'LEAVE_SYNC';
  created_at: string;
};

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (profile as { role?: 'employee' | 'admin' } | null)?.role;
  return { supabase, user, role };
}

export function utcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}