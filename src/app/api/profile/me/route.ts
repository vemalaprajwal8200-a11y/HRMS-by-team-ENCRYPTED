import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorized } from '@/lib/api/guard';
import { enforceAllowlist } from '@/lib/api/profile-validation';
import { formatProfileRow, ProfileUpdate } from '@/types/profile';
import type { Database } from '@/types/database';
import type { ProfileRow } from '@/types/profile';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/me
 * Returns the signed-in user's profile. The profile row is auto-created by the
 * Phase 1 signup trigger (handle_new_user), so a missing row is exceptional —
 * we surface it as 404 rather than silently fabricating data.
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return unauthorized();

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          'Profile not found. It should be created automatically on signup — try signing in again.',
      },
      { status: 404 }
    );
  }

  const profile: ProfileRow = data;
  const formatted = formatProfileRow(profile);

  // Read-only payroll snapshot: Phase 5 owns the `payroll` table; until rows
  // exist there, the contracted structure stored on the profile is shown.
  const { data: latestPayrollData } = await supabase
    .from('payroll')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestPayroll =
    latestPayrollData as Database['public']['Tables']['payroll']['Row'] | null;

  return NextResponse.json({
    profile: formatted,
    payroll_snapshot: latestPayroll
      ? {
          month: latestPayroll.month,
          gross_salary: Number(latestPayroll.gross_salary),
          total_allowances: Number(latestPayroll.total_allowances),
          total_deductions: Number(latestPayroll.total_deductions),
          net_salary: Number(latestPayroll.net_salary),
          status: latestPayroll.status,
        }
      : null,
    editable_fields: ['phone', 'address', 'photo_url'],
  });
}

/**
 * PATCH /api/profile/me
 * EMPLOYEE self-edit. Server-side allowlist enforcement: any field other than
 * phone / address / photo_url is rejected with 403 even if the client sends it.
 */
export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const result = enforceAllowlist(body, 'employee');
  if (!result.ok) return result.response!;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from('profiles')
    .update(result.payload! as ProfileUpdate)
    .eq('id', user.id)
    .select()
    .single();

  if (error || !data) {
    console.error('PATCH /api/profile/me failed:', error?.message);
    return NextResponse.json(
      { error: 'Could not update your profile. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: formatProfileRow(data) });
}
