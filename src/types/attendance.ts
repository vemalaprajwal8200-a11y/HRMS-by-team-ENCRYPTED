// Phase 3 Type Stub: Attendance Management
export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string | null; // ISO timestamp
  checkOut?: string | null; // ISO timestamp
  status: AttendanceStatus;
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
