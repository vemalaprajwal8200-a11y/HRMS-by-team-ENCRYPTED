export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'employee' | 'admin';

export interface Database {
  public: {
    Tables: {      profiles: {
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
          documents: Json | null;
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
          documents?: Json | null;
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
          documents?: Json | null;
          base_salary?: number | null;
          allowances?: number | null;
          deductions?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [],
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: 'present' | 'absent' | 'half-day' | 'leave';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'present' | 'absent' | 'half-day' | 'leave';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'present' | 'absent' | 'half-day' | 'leave';
          created_at?: string;
        };
        Relationships: [],
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          type: 'paid' | 'sick' | 'unpaid' | 'casual' | 'maternity' | 'paternity';
          start_date: string;
          end_date: string;
          remarks: string | null;
          status: 'pending' | 'approved' | 'rejected';
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
          status?: 'pending' | 'approved' | 'rejected';
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
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          comments?: string | null;
          created_at?: string;
        };
        Relationships: [],
      };
      payroll: {
        Row: {
          id: string;
          user_id: string;
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
          month?: string;
          gross_salary?: number;
          total_allowances?: number;
          total_deductions?: number;
          net_salary?: number;
          status?: 'draft' | 'processed' | 'paid';
          created_at?: string;
        };
        Relationships: [],
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
