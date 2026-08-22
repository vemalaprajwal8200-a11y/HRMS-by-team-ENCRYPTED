// ==============================================================================
// DAYFLOW HRMS — Phase 4: Leave -> Attendance sync
// ------------------------------------------------------------------------------
// This is the SINGLE entry point for writing leave-driven attendance records.
// It invokes the `apply_leave_decision` Postgres function (defined in migration
// 0003), which performs the entire transition inside ONE transaction:
//   - state-machine guard (only PENDING -> APPROVED/REJECTED)
//   - updates leave_requests (status, reviewed_by, reviewed_at, admin_comment)
//   - upserts LEAVE / LEAVE_SYNC attendance records for every date in range
//     (reusing the attendance table's unique (user_id, date) constraint)
//   - inserts the employee notification
//
// Keeping the attendance upsert here (in the attendance module) means Phase 4
// never writes raw attendance rows inline — consistent with Phase 3.
// ==============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { LeaveStatus } from '@/types/leave';

export interface LeaveDecisionInput {
  requestId: string;
  adminId: string;
  status: Extract<LeaveStatus, 'approved' | 'rejected'>;
  adminComment?: string | null;
}

export interface LeaveDecisionResult {
  id: string;
  user_id: string;
  type: 'paid' | 'sick' | 'unpaid';
  start_date: string;
  end_date: string;
  remarks: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  admin_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/**
 * Apply an admin decision to a leave request. Throws if the RPC errors
 * (e.g. request not found, or already decided). The caller maps the error
 * to the right HTTP status.
 */
export async function applyLeaveDecision(
  supabase: SupabaseClient<Database>,
  input: LeaveDecisionInput
): Promise<LeaveDecisionResult> {
  const { data, error } = await supabase.rpc('apply_leave_decision', {
    p_request_id: input.requestId,
    p_admin_id: input.adminId,
    p_status: input.status,
    p_admin_comment: input.adminComment ?? null,
  });

  if (error) {
    throw new LeaveDecisionError(error.message, error);
  }

  return data as unknown as LeaveDecisionResult;
}

export class LeaveDecisionError extends Error {
  cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'LeaveDecisionError';
    this.cause = cause;
  }
}
