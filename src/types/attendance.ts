export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type AttendanceSource = 'AUTO' | 'LEAVE_SYNC';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string | null; // ISO timestamp
  checkOut?: string | null; // ISO timestamp
  status: AttendanceStatus;
  source: AttendanceSource;
  workHours?: number;
  notes?: string;
  createdAt: string;
}

export interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}
