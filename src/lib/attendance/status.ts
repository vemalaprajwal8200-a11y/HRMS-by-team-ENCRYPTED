// ==============================================================================
// DAYFLOW HRMS — Attendance Status Derivation (Phase 3)
// ------------------------------------------------------------------------------
// This module is ISOLATED and EXPORTED on purpose: Phase 4 (Leave Approval)
// will either call `deriveAttendanceStatus` directly to recompute a record, or
// write a `leave` status with `source = 'leave_sync'` that this function is
// explicitly told to never clobber.
//
// Design notes:
//  - This is a PURE function (no DB / no Supabase imports) so it can be used
//    both server-side (route handlers, lazy "compute on read") and on the
//    client without pulling in server-only code.
//  - Status is derived from check-in/out timestamps ONLY. `leave` is an
//    external override owned by Phase 4 and is always returned as-is.
// ==============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave';
export type AttendanceSource = 'auto' | 'leave_sync';

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'present',
  'absent',
  'half_day',
  'leave',
];

/**
 * Worked fewer than this many hours (and checked in/out) counts as a half day.
 * Simple, explicit threshold — do not over-engineer.
 */
export const MIN_WORK_HOURS_FOR_FULL_DAY = 4;

/**
 * Check-in at or after this hour (local time) also counts as a half day
 * (late arrival). Simple, explicit threshold.
 */
export const LATE_CHECK_IN_HOUR = 11;

export interface AttendanceStatusInput {
  checkIn: string | null;
  checkOut: string | null;
  /** Existing persisted status. If it is `leave`, it is preserved. */
  status: AttendanceStatus;
  /** Existing source. `leave_sync` records are managed externally (Phase 4). */
  source?: AttendanceSource;
}

/** Hours worked between check-in and check-out, or null if incomplete. */
export function computeWorkedHours(
  checkIn: string | null,
  checkOut: string | null
): number | null {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms < 0) return 0;
  return ms / (1000 * 60 * 60);
}

/**
 * Derive the attendance status for a single record from its check-in/out data.
 *
 * Rules:
 *  - LEAVE is never touched (reserved for Phase 4 writes, source = 'leave_sync').
 *  - No check-in                       -> ABSENT
 *  - Check-in present, no check-out    -> HALF_DAY  (forgot to check out: flagged)
 *  - Check-in + check-out, worked < 4h -> HALF_DAY  (left early)
 *  - Check-in >= 11:00 (late arrival)  -> HALF_DAY
 *  - Otherwise                         -> PRESENT
 *
 * Idempotent: re-running it on an already-persisted record returns the same
 * status, and it correctly reflects a "live" half-day for a not-yet-checked-out
 * record when computed on read.
 */
export function deriveAttendanceStatus(record: AttendanceStatusInput): AttendanceStatus {
  // External override — Phase 4 owns this, never overwrite.
  if (record.status === 'leave') {
    return 'leave';
  }

  if (!record.checkIn) {
    return 'absent';
  }

  // Forgot to check out (or not yet) -> flagged as half day on read.
  if (!record.checkOut) {
    return 'half_day';
  }

  const worked = computeWorkedHours(record.checkIn, record.checkOut);
  if (worked !== null && worked < MIN_WORK_HOURS_FOR_FULL_DAY) {
    return 'half_day';
  }

  const checkInHour = new Date(record.checkIn).getHours();
  if (checkInHour >= LATE_CHECK_IN_HOUR) {
    return 'half_day';
  }

  return 'present';
}

// ------------------------------------------------------------------------------
// Date helpers used by the "lazy compute on read" approach (no cron job needed).
// ------------------------------------------------------------------------------

/** Format a Date as a YYYY-MM-DD string in LOCAL time. */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns true for Monday–Friday (working days used for absent synthesis). */
export function isWorkingDay(d: Date): boolean {
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  return day !== 0 && day !== 6;
}

/** Monday–Sunday range (inclusive) containing `ref`. */
export function getWeekRange(ref: Date = new Date()): { start: string; end: string } {
  const d = new Date(ref);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateStr(start), end: toDateStr(end) };
}

export interface AttendanceViewRow {
  date: string;
  status: AttendanceStatus;
}

/**
 * Fill the gaps in a date range with synthesized ABSENT entries for any working
 * day that has no real attendance record. Used by the read endpoints so an
 * employee who never checked in still shows up as ABSENT (lazy computation).
 */
export function fillAbsentDays(
  records: { date: string; status: AttendanceStatus }[],
  start: string,
  end: string
): AttendanceViewRow[] {
  const byDate = new Map(records.map((r) => [r.date, r.status]));
  const result: AttendanceViewRow[] = [];
  const cursor = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');

  while (cursor <= last) {
    const ds = toDateStr(cursor);
    if (byDate.has(ds)) {
      result.push({ date: ds, status: byDate.get(ds)! });
    } else if (isWorkingDay(cursor)) {
      result.push({ date: ds, status: 'absent' });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
