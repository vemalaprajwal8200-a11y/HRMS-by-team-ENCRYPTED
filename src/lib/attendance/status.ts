export const LATE_CHECK_IN_HOUR = 11;
export const WORKDAY_END_HOUR = 18;

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type AttendanceSource = 'AUTO' | 'LEAVE_SYNC';

export interface AttendanceStatusRecord {
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  source: AttendanceSource;
}

export function deriveAttendanceStatus(
  record: AttendanceStatusRecord,
  now = new Date()
): AttendanceStatus {
  if (record.source === 'LEAVE_SYNC') return record.status;
  if (!record.check_in) {
    return now.getUTCHours() >= WORKDAY_END_HOUR ? 'ABSENT' : record.status;
  }

  const checkIn = new Date(record.check_in);
  if (!record.check_out || checkIn.getUTCHours() >= LATE_CHECK_IN_HOUR) return 'HALF_DAY';
  return 'PRESENT';
}