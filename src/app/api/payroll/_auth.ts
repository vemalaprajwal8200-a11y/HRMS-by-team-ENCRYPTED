import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role, department').eq('id', user.id).maybeSingle();
  const details = profile as { role?: 'employee' | 'admin'; department?: string | null } | null;
  return { supabase, user, role: details?.role, department: details?.department };
}