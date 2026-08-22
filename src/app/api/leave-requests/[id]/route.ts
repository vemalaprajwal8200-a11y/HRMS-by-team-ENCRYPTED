import { NextResponse } from 'next/server';
import { requireUser } from '../_auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const status = body.status as 'APPROVED' | 'REJECTED';
  if (!['APPROVED', 'REJECTED'].includes(status)) return NextResponse.json({ error: 'Status must be APPROVED or REJECTED.' }, { status: 400 });
  const { data, error } = await auth.supabase.rpc('decide_leave_request', { request_id: params.id, next_status: status, comment_text: body.admin_comment?.trim() || null } as never);
  if (error) {
    const code = error.message.includes('REQUEST_ALREADY_DECIDED') ? 409 : error.message.includes('ADMIN_REQUIRED') ? 403 : 400;
    return NextResponse.json({ error: code === 409 ? 'This leave request has already been decided.' : error.message }, { status: code });
  }
  return NextResponse.json({ request: data });
}