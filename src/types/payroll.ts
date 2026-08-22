export interface PayrollRecord {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  updatedAt: string;
  updatedBy?: string | null;
}
