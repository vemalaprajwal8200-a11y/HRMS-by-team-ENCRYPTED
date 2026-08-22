export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'employee' | 'admin';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type AttendanceSource = 'AUTO' | 'LEAVE_SYNC';
export type LeaveType = 'PAID' | 'SICK' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollComponentType = 'FIXED' | 'PERCENTAGE';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          employee_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          phone: string | null;
          address: string | null;
          photo_url: string | null;
          designation: string | null;
          department: string | null;
          date_of_joining: string | null;
          employment_type: string | null;
          base_salary: number | null;
          allowances: number | null;
          deductions: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          phone?: string | null;
          address?: string | null;
          photo_url?: string | null;
          designation?: string | null;
          department?: string | null;
          date_of_joining?: string | null;
          employment_type?: string | null;
          base_salary?: number | null;
          allowances?: number | null;
          deductions?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          phone?: string | null;
          address?: string | null;
          photo_url?: string | null;
          designation?: string | null;
          department?: string | null;
          date_of_joining?: string | null;
          employment_type?: string | null;
          base_salary?: number | null;
          allowances?: number | null;
          deductions?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: AttendanceStatus;
          source: AttendanceSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: AttendanceStatus;
          source?: AttendanceSource;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: AttendanceStatus;
          source?: AttendanceSource;
          created_at?: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          type: LeaveType;
          start_date: string;
          end_date: string;
          remarks: string | null;
          status: LeaveStatus;
          admin_comment: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'paid' | 'sick' | 'unpaid' | 'casual' | 'maternity' | 'paternity';
          start_date: string;
          end_date: string;
          remarks?: string | null;
          status?: LeaveStatus;
          admin_comment?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'paid' | 'sick' | 'unpaid' | 'casual' | 'maternity' | 'paternity';
          start_date?: string;
          end_date?: string;
          remarks?: string | null;
          status?: LeaveStatus;
          admin_comment?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          comments?: string | null;
          created_at?: string;
        };
      };
      payroll: {
        Row: {
          id: string;
          user_id: string;
          basic_salary: number;
          allowances: number;
          deductions: number;
          updated_at: string;
          updated_by: string | null;
          month_wage: number | null;
          working_days_per_week: number;
          break_time_hours: number;
          basic_salary_type: PayrollComponentType;
          basic_salary_value: number;
          hra_type: PayrollComponentType;
          hra_value: number;
          standard_allowance_type: PayrollComponentType;
          standard_allowance_value: number;
          performance_bonus_type: PayrollComponentType;
          performance_bonus_value: number;
          leave_travel_allowance_type: PayrollComponentType;
          leave_travel_allowance_value: number;
          pf_employee_percent: number;
          pf_employer_percent: number;
          professional_tax: number;
          month: string;
          gross_salary: number;
          total_allowances: number;
          total_deductions: number;
          net_salary: number;
          status: 'draft' | 'processed' | 'paid';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          basic_salary?: number;
          allowances?: number;
          deductions?: number;
          updated_at?: string;
          updated_by?: string | null;
          month_wage?: number | null;
          working_days_per_week?: number;
          break_time_hours?: number;
          basic_salary_type?: PayrollComponentType;
          basic_salary_value?: number;
          hra_type?: PayrollComponentType;
          hra_value?: number;
          standard_allowance_type?: PayrollComponentType;
          standard_allowance_value?: number;
          performance_bonus_type?: PayrollComponentType;
          performance_bonus_value?: number;
          leave_travel_allowance_type?: PayrollComponentType;
          leave_travel_allowance_value?: number;
          pf_employee_percent?: number;
          pf_employer_percent?: number;
          professional_tax?: number;
          month: string;
          gross_salary: number;
          total_allowances?: number;
          total_deductions?: number;
          net_salary: number;
          status?: 'draft' | 'processed' | 'paid';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          basic_salary?: number;
          allowances?: number;
          deductions?: number;
          updated_at?: string;
          updated_by?: string | null;
          month_wage?: number | null;
          working_days_per_week?: number;
          break_time_hours?: number;
          basic_salary_type?: PayrollComponentType;
          basic_salary_value?: number;
          hra_type?: PayrollComponentType;
          hra_value?: number;
          standard_allowance_type?: PayrollComponentType;
          standard_allowance_value?: number;
          performance_bonus_type?: PayrollComponentType;
          performance_bonus_value?: number;
          leave_travel_allowance_type?: PayrollComponentType;
          leave_travel_allowance_value?: number;
          pf_employee_percent?: number;
          pf_employer_percent?: number;
          professional_tax?: number;
          month?: string;
          gross_salary?: number;
          total_allowances?: number;
          total_deductions?: number;
          net_salary?: number;
          status?: 'draft' | 'processed' | 'paid';
          created_at?: string;
        };
      };
      leave_balances: {
        Row: { id: string; user_id: string; leave_type: LeaveType; allocated_days: number; year: number };
        Insert: { id?: string; user_id: string; leave_type: LeaveType; allocated_days?: number; year: number };
        Update: { id?: string; user_id?: string; leave_type?: LeaveType; allocated_days?: number; year?: number };
      };
    };
  };
}
