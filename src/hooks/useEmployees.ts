'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { FormattedProfile, formatProfileRow } from '@/types/profile';

// Mock sample dataset for seamless fallback preview when DB is initializing
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
        setEmployees([]);
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

  const updateEmployee = async (
    id: string,
    updates: {
      fullName?: string;
      role?: 'employee' | 'admin';
      designation?: string;
      department?: string;
      employmentType?: string;
      phone?: string;
      address?: string;
      baseSalary?: number;
      allowances?: number;
      deductions?: number;
    }
  ) => {
    if (!configured) return { error: new Error('Supabase not configured') };

    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.designation !== undefined) payload.designation = updates.designation;
      if (updates.department !== undefined) payload.department = updates.department;
      if (updates.employmentType !== undefined) payload.employment_type = updates.employmentType;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.baseSalary !== undefined) payload.base_salary = updates.baseSalary;
      if (updates.allowances !== undefined) payload.allowances = updates.allowances;
      if (updates.deductions !== undefined) payload.deductions = updates.deductions;

      const { data, error: updateError } = await (supabase.from('profiles') as any)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return { error: updateError };
      }

      await fetchEmployees();
      return { error: null, data: formatProfileRow(data) };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Update failed');
      return { error: e };
    }
  };

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees,
    updateEmployee,
  };
}

export function useEmployeeProfile(id: string) {
  const [profile, setProfile] = useState<FormattedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = isSupabaseConfigured();

  const loadProfile = useCallback(async () => {
    if (!id) return;
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
  }, [id, configured, supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (updates: {
    fullName?: string;
    role?: 'employee' | 'admin';
    designation?: string;
    department?: string;
    employmentType?: string;
    phone?: string;
    address?: string;
    baseSalary?: number;
    allowances?: number;
    deductions?: number;
  }) => {
    if (!configured) return { error: new Error('Supabase not configured') };

    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.designation !== undefined) payload.designation = updates.designation;
      if (updates.department !== undefined) payload.department = updates.department;
      if (updates.employmentType !== undefined) payload.employment_type = updates.employmentType;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.baseSalary !== undefined) payload.base_salary = updates.baseSalary;
      if (updates.allowances !== undefined) payload.allowances = updates.allowances;
      if (updates.deductions !== undefined) payload.deductions = updates.deductions;

      const { data, error: updateError } = await (supabase.from('profiles') as any)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return { error: updateError };
      }

      const formatted = formatProfileRow(data);
      setProfile(formatted);
      return { error: null, data: formatted };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error('Update failed');
      return { error: e };
    }
  };

  return { profile, isLoading, error, refetch: loadProfile, updateProfile };
}
