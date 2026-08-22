import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorized, forbidden } from '@/lib/api/guard';
import { enforceAllowlist } from '@/lib/api/profile-validation';
import { formatProfileRow, ProfileUpdate } from '@/types/profile';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/[userId] — ADMIN ONLY.
 * Fetch any employee's full profile by auth user id (or employee_id).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await getAuthContext();
  if (!auth) return unauthorized();
  if (auth.role !== 'admin') {
    return forbidden('Admin access required to view other employees\' profiles.');
  }

  const userId = params.userId?.trim();
  if (!userId || userId.length > 100) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
  }

  // Accept either the auth UUID or the human-readable employee_id.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const column = isUuid ? 'id' : 'employee_id';

  const { data, error } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq(column, userId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Employee profile not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ profile: formatProfileRow(data) });
}

/**
 * PATCH /api/profile/[userId] — ADMIN ONLY.
 * Admins can update all HR-managed profile fields (name, job title,
 * department, joining date, employment type, documents, contact, photo).
 * Identity fields (id/email/employee_id/role) and payroll-owned salary
 * fields are rejected — role changes and email changes must go through the
 * Supabase Admin API, and salary belongs to the `payroll` table (Phase 5).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await getAuthContext();
  if (!auth) return unauthorized();
  if (auth.role !== 'admin') {
    return forbidden('Admin access required to edit other employees\' profiles.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const result = enforceAllowlist(body, 'admin');
  if (!result.ok) return result.response!;

  const userId = params.userId?.trim();
  if (!userId || userId.length > 100) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
  }
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const column = isUuid ? 'id' : 'employee_id';

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(result.payload! as ProfileUpdate)
    .eq(column, userId)
    .select()
    .single();

  if (error || !data) {
    console.error('PATCH /api/profile/[userId] failed:', error?.message);
    return NextResponse.json(
      { error: 'Could not update this employee profile. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: formatProfileRow(data) });
}
