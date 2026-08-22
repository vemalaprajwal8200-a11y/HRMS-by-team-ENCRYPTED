'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchEmployees,
  ApiError,
  DirectoryRow,
  EmployeesResponse,
} from '@/lib/api/client';

const SAMPLE_DIRECTORY: DirectoryRow[] = [
  {
    id: 'emp-uuid-1',
    employee_id: 'EMP-1001',
    full_name: 'Alex Vance',
    email: 'alex.vance@dayflow.internal',
    role: 'employee',
    designation: 'Senior Full Stack Engineer',
    department: 'Engineering',
    photo_url: null,
    date_of_joining: '2023-01-15',
  },
  {
    id: 'emp-uuid-2',
    employee_id: 'EMP-1002',
    full_name: 'Priya Sharma',
    email: 'priya.sharma@dayflow.internal',
    role: 'admin',
    designation: 'HR Lead Administrator',
    department: 'Human Resources',
    photo_url: null,
    date_of_joining: '2022-06-10',
  },
  {
    id: 'emp-uuid-3',
    employee_id: 'EMP-1003',
    full_name: 'Rohan Deshmukh',
    email: 'rohan.d@dayflow.internal',
    role: 'employee',
    designation: 'UI/UX Product Designer',
    department: 'Design',
    photo_url: null,
    date_of_joining: '2023-09-01',
  },
];

interface UseEmployeeDirectoryOptions {
  /** Milliseconds to wait after the last keystroke before querying (default 350). */
  debounceMs?: number;
}

/**
 * Server-side searchable/filterable employee directory backed by
 * GET /api/employees (admin-only). Search and department filters are applied
 * IN POSTGRES — this hook only debounces input and manages request lifecycle,
 * so it scales with the eventual dataset.
 *
 * Reuse this exact pattern (debounce -> GET endpoint -> rows+facets) for the
 * Phase 3 attendance review list and Phase 4 leave approval queue.
 */
export function useEmployeeDirectory(
  options: UseEmployeeDirectoryOptions = {}
) {
  const { debounceMs = 350 } = options;

  const [searchInput, setSearchInput] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [pagination, setPagination] =
    useState<EmployeesResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  // Debounce raw input into an effective search term.
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1); // reset to first page whenever criteria change
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [searchInput, debounceMs]);

  useEffect(() => {
    setPage(1); // department changes also reset pagination
  }, [departmentFilter]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEmployees({
        search: searchTerm || undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        page,
        pageSize: 25,
      });
      setRows(response.employees);
      setDepartments(response.departments);
      setPagination(response.pagination);
      setIsConfigured(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Admin access required.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load employees.');
      }
      // Demo-mode fallback keeps the UI alive if Supabase env vars are absent.
      setRows(SAMPLE_DIRECTORY);
      setDepartments(Array.from(new Set(SAMPLE_DIRECTORY.map((r) => r.department ?? ''))));
      setPagination({
        page: 1,
        pageSize: 25,
        total: SAMPLE_DIRECTORY.length,
        totalPages: 1,
      });
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, departmentFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    searchInput,
    setSearchInput,
    departmentFilter,
    setDepartmentFilter,
    departments,
    rows,
    pagination,
    isLoading,
    error,
    isConfigured,
    refetch: load,
    goToPage: setPage,
  };
}
