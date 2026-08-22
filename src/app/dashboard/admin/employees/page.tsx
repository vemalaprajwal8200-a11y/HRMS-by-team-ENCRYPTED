'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Shield, ArrowLeft } from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { EmployeeDirectoryTable } from '@/components/dashboard/EmployeeDirectoryTable';
import { Button } from '@/components/ui/Button';

export default function AdminEmployeeDirectoryPage() {
  const {
    searchInput,
    setSearchInput,
    departmentFilter,
    setDepartmentFilter,
    departments,
    rows,
    pagination,
    isLoading,
    error,
    goToPage,
  } = useEmployeeDirectory();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back navigation */}
      <div>
        <Link href="/dashboard/admin">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-surface-600 hover:text-surface-900"
          >
            Back to Overview
          </Button>
        </Link>
      </div>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/80 via-white to-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-semibold mb-1">
            <Shield className="w-3 h-3 text-brand-600" />
            <span>Administrator Tooling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600" />
            Employee Directory
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            Search, filter by department, and open any team member&apos;s full
            profile for HR-managed edits.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200 text-surface-700 shrink-0">
          {pagination ? `${pagination.total} records` : '…'}
        </span>
      </motion.div>

      {/* Server-filtered table */}
      <EmployeeDirectoryTable
        rows={rows}
        departments={departments}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        isLoading={isLoading}
        error={error}
        pagination={
          pagination
            ? {
                page: pagination.page,
                total: pagination.total,
                totalPages: pagination.totalPages,
              }
            : null
        }
        onPageChange={goToPage}
      />
    </div>
  );
}
