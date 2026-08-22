import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: viewer } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((viewer as { role?: string } | null)?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { data, error } = await supabase.from('profiles').select('*').eq('id', params.userId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: viewer } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if ((viewer as { role?: string } | null)?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const allowed = ['full_name', 'phone', 'address', 'designation', 'department', 'photo_url', 'date_of_joining', 'employment_type'];
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  const { data, error } = await supabase.from('profiles').update(update as never).eq('id', params.userId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}