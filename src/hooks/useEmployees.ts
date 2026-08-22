'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { FormattedProfile, formatProfileRow } from '@/types/profile';

// Mock sample dataset for seamless fallback preview when DB is initializing or empty
const SAMPLE_EMPLOYEES: FormattedProfile[] = [
  {
    id: 'emp-uuid-1',
    employeeId: 'EMP-1001',
    fullName: 'Alex Vance',
    email: 'alex.vance@dayflow.internal',
    role: 'employee',
    phone: '+91 98765 43210',
    address: 'Indiranagar 100ft Road, Bangalore, KA 560038',
    photoUrl: undefined,
    designation: 'Senior Full Stack Engineer',
    department: 'Engineering',
    dateOfJoining: '2023-01-15',
    employmentType: 'Full-time',
    salaryStructure: {
      baseSalary: 95000,
      allowances: 30000,
      deductions: 14000,
      netSalary: 111000,
    },
    documents: [],
    createdAt: '2023-01-15T09:00:00Z',
    updatedAt: '2023-01-15T09:00:00Z',
  },
  {
    id: 'emp-uuid-2',
    employeeId: 'EMP-1002',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@dayflow.internal',
    role: 'admin',
    phone: '+91 98111 22334',
    address: 'Koramangala 4th Block, Bangalore, KA 560034',
    photoUrl: undefined,
    designation: 'HR Lead Administrator',
    department: 'Human Resources',
    dateOfJoining: '2022-06-10',
    employmentType: 'Full-time',
    salaryStructure: {
      baseSalary: 105000,
      allowances: 35000,
      deductions: 18000,
      netSalary: 122000,
    },
    documents: [],
    createdAt: '2022-06-10T09:00:00Z',
    updatedAt: '2022-06-10T09:00:00Z',
  },
  {
    id: 'emp-uuid-3',
    employeeId: 'EMP-1003',
    fullName: 'Rohan Deshmukh',
    email: 'rohan.d@dayflow.internal',
    role: 'employee',
    phone: '+91 99887 66554',
    address: 'HSR Layout Sector 2, Bangalore, KA 560102',
    photoUrl: undefined,
    designation: 'UI/UX Product Designer',
    department: 'Design',
    dateOfJoining: '2023-09-01',
    employmentType: 'Full-time',
    salaryStructure: {
      baseSalary: 85000,
      allowances: 25000,
      deductions: 12000,
      netSalary: 98000,
    },
    documents: [],
    createdAt: '2023-09-01T09:00:00Z',
    updatedAt: '2023-09-01T09:00:00Z',
  },
  {
    id: 'emp-uuid-4',
    employeeId: 'EMP-1004',
    fullName: 'Ananya Iyer',
    email: 'ananya.iyer@dayflow.internal',
    role: 'employee',
    phone: '+91 97766 55443',
    address: 'Whitefield, Bangalore, KA 560066',
    photoUrl: undefined,
    designation: 'Backend Systems Engineer',
    department: 'Engineering',
    dateOfJoining: '2024-02-15',
    employmentType: 'Full-time',
    salaryStructure: {
      baseSalary: 90000,
      allowances: 28000,
      deductions: 13000,
      netSalary: 105000,
    },
    documents: [],
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
  },
];

export function useEmployees() {
  const [employees, setEmployees] = useState<FormattedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!configured) {
      setEmployees(SAMPLE_EMPLOYEES);
      setIsLoading(false);
      return;
    }

    try {
      const adminResponse = await fetch('/api/employees');
      if (adminResponse.ok) {
        const result = await adminResponse.json();
        setEmployees((result.employees || []).map((row: any) => ({ ...formatProfileRow(row), attendanceStatus: row.attendance_status })));
        setIsLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Could not fetch real profiles, using sample data:', fetchError.message);
        setEmployees(SAMPLE_EMPLOYEES);
      } else if (data && data.length > 0) {
        setEmployees(data.map(formatProfileRow));
      } else {
        // If DB table is empty, show sample dataset so dashboard looks alive
        setEmployees(SAMPLE_EMPLOYEES);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(message);
      setEmployees(SAMPLE_EMPLOYEES);
    } finally {
      setIsLoading(false);
    }
  }, [configured, supabase]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees,
  };
}

export function useEmployeeProfile(id: string) {
  const [profile, setProfile] = useState<FormattedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      if (!configured) {
        const found = SAMPLE_EMPLOYEES.find((e) => e.id === id || e.employeeId === id) || SAMPLE_EMPLOYEES[0];
        setProfile(found);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          // Check fallback mock
          const found = SAMPLE_EMPLOYEES.find((e) => e.id === id || e.employeeId === id);
          if (found) {
            setProfile(found);
          } else {
            setError(fetchError.message);
          }
        } else if (data) {
          setProfile(formatProfileRow(data));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch employee';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadProfile();
    }
  }, [id, configured, supabase]);

  return { profile, isLoading, error };
}
