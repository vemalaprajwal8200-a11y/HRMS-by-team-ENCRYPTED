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
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: 'present' | 'absent' | 'half_day' | 'leave';
          source: 'auto' | 'leave_sync';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'present' | 'absent' | 'half_day' | 'leave';
          source?: 'auto' | 'leave_sync';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'present' | 'absent' | 'half_day' | 'leave';
          source?: 'auto' | 'leave_sync';
          created_at?: string;
        };
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          type: 'paid' | 'sick' | 'unpaid';
          start_date: string;
          end_date: string;
          remarks: string | null;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          admin_comment: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'paid' | 'sick' | 'unpaid';
          start_date: string;
          end_date: string;
          remarks?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          admin_comment?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'paid' | 'sick' | 'unpaid';
          start_date?: string;
          end_date?: string;
          remarks?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          admin_comment?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      apply_leave_decision: {
        Args: {
          p_request_id: string;
          p_admin_id: string;
          p_status: string;
          p_admin_comment: string | null;
        };
        Returns: {
          id: string;
          user_id: string;
          type: 'paid' | 'sick' | 'unpaid';
          start_date: string;
          end_date: string;
          remarks: string | null;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          admin_comment: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
      };
    };
  };
}
