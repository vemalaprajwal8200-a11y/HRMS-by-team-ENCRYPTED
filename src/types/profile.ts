import { Database, UserRole } from './database';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// ============================================================================
// FIELD ALLOWLISTS — single source of truth for what each endpoint accepts.
// The server enforces these; the frontend merely mirrors them for UX.
// ============================================================================

/** Fields an EMPLOYEE may update on their own profile (PATCH /api/profile/me). */
export const EMPLOYEE_EDITABLE_FIELDS = [
  'phone',
  'address',
  'photo_url',
] as const;

/**
 * Fields an ADMIN may update via PATCH /api/profile/[userId].
 * Deliberately excludes: id, email, employee_id, role (identity/auth fields —
 * changing these requires Supabase Admin API and is out of Phase 2 scope) and
 * base_salary/allowances/deductions (payroll-owned; Phase 5 reads `payroll`).
 */
export const ADMIN_EDITABLE_FIELDS = [
  'full_name',
  'phone',
  'address',
  'photo_url',
  'designation',
  'department',
  'date_of_joining',
  'employment_type',
  'documents',
] as const;

export type EmployeeEditableField = (typeof EMPLOYEE_EDITABLE_FIELDS)[number];
export type AdminEditableField = (typeof ADMIN_EDITABLE_FIELDS)[number];

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
}

/** Parse the jsonb `documents` column into typed DocumentItem[]. */
function parseDocuments(raw: ProfileRow['documents']): DocumentItem[] {
  if (!raw || !Array.isArray(raw)) return [];

  const docs: DocumentItem[] = [];
  raw.forEach((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return;
    }
    const doc = entry as unknown as Record<string, unknown>;
    // Drop malformed entries rather than fabricating defaults — a document
    // without a usable name or URL would just render as a dead link.
    if (
      typeof doc.name !== 'string' ||
      !doc.name.trim() ||
      typeof doc.url !== 'string' ||
      !/^https?:\/\/.+/.test(doc.url.trim())
    ) {
      return;
    }
    const category = doc.category;
    docs.push({
      id:
        typeof doc.id === 'string'
          ? doc.id
          : `doc-${index}-${doc.name.trim().slice(0, 12)}`,
      name: doc.name.trim(),
      url: doc.url.trim(),
      uploadedAt:
        typeof doc.uploaded_at === 'string'
          ? doc.uploaded_at
          : new Date().toISOString(),
      category:
        category === 'id_proof' ||
        category === 'contract' ||
        category === 'tax' ||
        category === 'other'
          ? category
          : 'other',
    });
  });
  return docs;
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
    documents: parseDocuments(row.documents),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
