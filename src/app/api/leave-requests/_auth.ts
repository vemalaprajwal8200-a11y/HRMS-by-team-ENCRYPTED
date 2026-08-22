import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type LeaveRow = {
  id: string; user_id: string; type: 'PAID' | 'SICK' | 'UNPAID'; start_date: string; end_date: string;
  remarks: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED'; admin_comment: string | null;
  reviewed_by: string | null; reviewed_at: string | null; created_at: string;
};

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (profile as { role?: 'employee' | 'admin' } | null)?.role;
  return { supabase, user, role };
}

export function dateOnly(value: string) { return new Date(`${value}T00:00:00.000Z`); }