// Phase 5 Type Stub: Payroll Processing
export type PayrollStatus = 'draft' | 'processed' | 'paid';

export interface PayrollRecord {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  month: string; // YYYY-MM
  grossSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  payDate?: string | null;
  payslipUrl?: string | null;
  createdAt: string;
}
