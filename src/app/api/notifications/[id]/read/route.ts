import { NextResponse } from 'next/server';
import { requireUser } from '@/app/api/leave-requests/_auth';

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('notifications').update({ read: true } as never).eq('id', params.id).eq('user_id', auth.user.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notification: data });
}