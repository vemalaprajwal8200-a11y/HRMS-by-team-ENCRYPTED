'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, UserCheck, ArrowRight, Building, Filter, ExternalLink } from 'lucide-react';
import { FormattedProfile } from '@/types/profile';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { getInitials } from '@/lib/utils';

interface EmployeeTableProps {
  employees: FormattedProfile[];
  isLoading: boolean;
}

export function EmployeeTable({ employees, isLoading }: EmployeeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Client-side filtering by name, employee ID, email, or department
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return employees.filter((emp) => {
      const matchesSearch =
        !term ||
        emp.fullName.toLowerCase().includes(term) ||
        emp.employeeId.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.designation.toLowerCase().includes(term);

      const matchesDept =
        departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4" id="employees">
      {/* Table Header & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, ID, designation, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-surface-200 bg-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-subtle"
          />
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-subtle"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                <th className="py-3 px-4 sm:px-6">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Access Level</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-500">
                    <UserCheck className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                    <p className="font-medium text-sm text-surface-700">No employees found</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Try adjusting your search criteria or clear the filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const initials = getInitials(emp.fullName);
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-surface-50/70 transition-colors group"
                    >
                      {/* Name and Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-surface-900 group-hover:text-brand-600 transition-colors">
                              {emp.fullName}
                            </div>
                            <div className="text-xs text-surface-500 truncate max-w-[180px] sm:max-w-[240px]">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 border border-surface-200 text-surface-700">
                          {emp.employeeId}
                        </span>
                      </td>

                      {/* Department & Designation */}
                      <td className="py-3.5 px-4">
                        <div className="text-surface-900 font-medium">{emp.designation}</div>
                        <div className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-surface-400" />
                          {emp.department}
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="py-3.5 px-4">
                        {emp.role === 'admin' ? (
                          <Badge variant="primary" size="sm">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Employee
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Link
                          href={`/dashboard/admin/employees/${emp.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer count */}
        <div className="py-3 px-4 sm:px-6 border-t border-surface-100 bg-surface-50/50 flex items-center justify-between text-xs text-surface-500">
          <span>Showing {filteredEmployees.length} of {employees.length} total team members</span>
          <span className="font-medium">Live sync enabled</span>
        </div>
      </div>
    </div>
  );
}
