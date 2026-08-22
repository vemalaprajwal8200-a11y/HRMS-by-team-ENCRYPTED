import { Database, UserRole } from './database';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface PersonalDetails {
  fullName: string;
  phone: string;
  address: string;
  photoUrl?: string;
  email: string;
}

export interface JobDetails {
  employeeId: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  employmentType: string;
  role: UserRole;
}

export interface SalaryStructure {
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  category: 'id_proof' | 'contract' | 'tax' | 'other';
}

export interface FormattedProfile {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  photoUrl?: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  employmentType: string;
  salaryStructure: SalaryStructure;
  documents: DocumentItem[];
  createdAt: string;
  updatedAt: string;
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

export function formatProfileRow(row: ProfileRow): FormattedProfile {
  const baseSalary = Number(row.base_salary || 0);
  const allowances = Number(row.allowances || 0);
  const deductions = Number(row.deductions || 0);
  const netSalary = Math.max(0, baseSalary + allowances - deductions);

  return {
    id: row.id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    phone: row.phone || 'Not provided',
    address: row.address || 'Not provided',
    photoUrl: row.photo_url || undefined,
    designation: row.designation || 'Software Engineer',
    department: row.department || 'Engineering',
    dateOfJoining: row.date_of_joining || new Date().toISOString().split('T')[0],
    employmentType: row.employment_type || 'Full-time',
    salaryStructure: {
      baseSalary,
      allowances,
      deductions,
      netSalary,
    },
    documents: [
      {
        id: 'doc-1',
        name: 'Employment Agreement.pdf',
        url: '#',
        uploadedAt: row.created_at,
        category: 'contract',
      },
      {
        id: 'doc-2',
        name: 'Government ID Copy.pdf',
        url: '#',
        uploadedAt: row.created_at,
        category: 'id_proof',
      },
    ],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
