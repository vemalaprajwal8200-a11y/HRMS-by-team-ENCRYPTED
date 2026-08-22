import {
  FormattedProfile,
  EmployeeEditableField,
  AdminEditableField,
  DocumentItem,
} from '@/types/profile';

export interface PayrollSnapshot {
  month: string;
  gross_salary: number;
  total_allowances: number;
  total_deductions: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
}

export class ApiError extends Error {
  status: number;
  rejectedFields?: string[];
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    extra?: { rejectedFields?: string[]; fieldErrors?: Record<string, string> }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.rejectedFields = extra?.rejectedFields;
    this.fieldErrors = extra?.fieldErrors;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const data = body as {
      error?: string;
      rejected_fields?: string[];
      field_errors?: Record<string, string>;
    };
    throw new ApiError(
      data.error || `Request failed (${response.status}).`,
      response.status,
      {
        rejectedFields: data.rejected_fields,
        fieldErrors: data.field_errors,
      }
    );
  }

  return body as T;
}

/** GET /api/profile/me — own profile + read-only payroll snapshot. */
export async function fetchMyProfile(): Promise<{
  profile: FormattedProfile;
  payroll_snapshot: PayrollSnapshot | null;
}> {
  const response = await fetch('/api/profile/me', { cache: 'no-store' });
  return parseResponse(response);
}

/** PATCH /api/profile/me — employee self-edit (server allowlists fields). */
export async function patchMyProfile(
  payload: Partial<Record<EmployeeEditableField, string | null>>
): Promise<{ profile: FormattedProfile }> {
  const response = await fetch('/api/profile/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

/** GET /api/profile/[userId] — admin view of any profile. */
export async function fetchEmployeeProfile(userId: string): Promise<{
  profile: FormattedProfile;
}> {
  const response = await fetch(`/api/profile/${encodeURIComponent(userId)}`, {
    cache: 'no-store',
  });
  return parseResponse(response);
}

/** PATCH /api/profile/[userId] — admin edit of any profile (all HR fields). */
export async function patchEmployeeProfile(
  userId: string,
  payload: Partial<Record<AdminEditableField, string | null | DocumentItem[]>>
): Promise<{ profile: FormattedProfile }> {
  const response = await fetch(`/api/profile/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export interface DirectoryRow {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'admin';
  designation: string | null;
  department: string | null;
  photo_url: string | null;
  date_of_joining: string | null;
}

export interface EmployeesResponse {
  employees: DirectoryRow[];
  departments: string[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** GET /api/employees — admin directory with server-side search/filter. */
export async function fetchEmployees(params: {
  search?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}): Promise<EmployeesResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.department && params.department !== 'ALL') {
    query.set('department', params.department);
  }
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`/api/employees${suffix}`, {
    cache: 'no-store',
  });
  return parseResponse(response);
}
