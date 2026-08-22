// Phase 4: Leave Requests & Approvals domain types
export type LeaveType = 'paid' | 'sick' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  remarks?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  adminComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  // Resolved employee name when returned from the admin endpoint.
  employeeName?: string | null;
  employeeId?: string | null;
  department?: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface LeaveBalance {
  paid: number;
  sick: number;
  unpaid: number;
}
