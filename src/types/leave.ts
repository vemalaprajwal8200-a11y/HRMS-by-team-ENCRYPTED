// Phase 4 Type Stub: Leave Requests & Approvals
export type LeaveType = 'paid' | 'sick' | 'unpaid' | 'casual' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  remarks?: string;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  comments?: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  paid: number;
  sick: number;
  casual: number;
}
