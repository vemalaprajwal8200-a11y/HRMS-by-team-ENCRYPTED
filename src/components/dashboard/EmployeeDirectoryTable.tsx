'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  UserCheck,
  Building,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/profile/Avatar';
import { DirectoryRow } from '@/lib/api/client';

/**
 * Reusable "admin sees a filterable list of employee-linked records" table.
 * Filtering is SERVER-SIDE: the parent owns the search/dept state (typically
 * via useEmployeeDirectory) and this component just renders it. Phase 3
 * (attendance review) and Phase 4 (leave approvals) should reuse this with
 * extra row-action props rather than building new tables.
 */
interface EmployeeDirectoryTableProps {
  rows: DirectoryRow[];
  departments: string[];
  searchInput: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  isLoading: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange?: (page: number) => void;
}

export function EmployeeDirectoryTable({
  rows,
  departments,
  searchInput,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  isLoading,
  error,
  pagination,
  onPageChange,
}: EmployeeDirectoryTableProps) {
  if (isLoading && rows.length === 0) {
    return <TableSkeleton rows={5} />;
  }

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-4" id="employees">
      {/* Search & filter controls — state lives in the parent (server queries) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-surface-200 bg-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-subtle"
          />
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentChange(e.target.value)}
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

      {error && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 font-medium">
          {error}
        </div>
      )}

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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-500">
                    <UserCheck className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                    <p className="font-medium text-sm text-surface-700">
                      No employees found
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Try adjusting your search criteria or clear the filters.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-surface-50/70 transition-colors group"
                  >
                    {/* Name and Email */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <Avatar name={emp.full_name} photoUrl={emp.photo_url ?? undefined} />
                        <div className="min-w-0">
                          <div className="font-semibold text-surface-900 group-hover:text-brand-600 transition-colors truncate max-w-[180px] sm:max-w-[240px]">
                            {emp.full_name}
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
                        {emp.employee_id}
                      </span>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-3.5 px-4">
                      <div className="text-surface-900 font-medium">
                        {emp.designation || '—'}
                      </div>
                      <div className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-surface-400" />
                        {emp.department || '—'}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count + server-driven pagination */}
        <div className="py-3 px-4 sm:px-6 border-t border-surface-100 bg-surface-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-surface-500">
          <span>
            Showing {rows.length} of {pagination?.total ?? rows.length} team members
            {searchInput || departmentFilter !== 'ALL' ? ' (filtered)' : ''}
          </span>

          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1.5 rounded-lg border border-surface-200 bg-white disabled:opacity-40 hover:bg-surface-100 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-medium px-1">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1.5 rounded-lg border border-surface-200 bg-white disabled:opacity-40 hover:bg-surface-100 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
