import { NextResponse } from 'next/server';
import { requireUser } from '@/app/api/leave-requests/_auth';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('notifications').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notifications: data ?? [] });
}