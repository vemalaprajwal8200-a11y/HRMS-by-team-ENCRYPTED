// Phase 3: Attendance Management domain types
import type { AttendanceStatus, AttendanceSource } from '@/lib/attendance/status';

export type { AttendanceStatus, AttendanceSource };

export interface AttendanceRecord {
  id: string | null;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string | null; // ISO timestamp
  checkOut?: string | null; // ISO timestamp
  status: AttendanceStatus;
  source?: AttendanceSource;
  createdAt?: string | null;
  synthesized?: boolean; // true when generated for a missing working day (absent)
}

export interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}
