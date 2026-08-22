'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  Shield,
  Sparkles,
  FileCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Building,
  Edit3,
  Search,
  Filter,
  Check,
  X,
  IndianRupee,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { useAllLeaves } from '@/hooks/useLeaves';
import { useAllAttendance } from '@/hooks/useAttendance';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AdminLeaveReview } from '@/components/dashboard/AdminLeaveReview';
import { AdminAttendanceTracker } from '@/components/dashboard/AdminAttendanceTracker';
import { AdminEditEmployeeModal } from '@/components/dashboard/AdminEditEmployeeModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { FormattedProfile } from '@/types/profile';

export default function AdminDashboardPage() {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { employees, isLoading: employeesLoading, updateEmployee } = useEmployees();
  const { allLeaves, pendingCount, isLoading: leavesLoading, reviewLeave, isSubmitting: isReviewing } = useAllLeaves();
  const { attendance: allAttendance, isLoading: attendanceLoading, refetch: refetchAttendance } = useAllAttendance();

  const [activeTab, setActiveTab] = useState<'employees' | 'leaves' | 'attendance'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const [editingEmp, setEditingEmp] = useState<FormattedProfile | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'employee' as 'employee' | 'admin',
    designation: '',
    department: '',
    employmentType: 'Full-time',
    baseSalary: 75000,
    allowances: 25000,
    deductions: 10000,
  });
  const [isSavingEmp, setIsSavingEmp] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectComments, setRejectComments] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendanceList = allAttendance.filter((a) => a.date === todayStr);
  const todayPresentCount = todayAttendanceList.filter((a) => a.status === 'present' || a.status === 'half-day').length;

  const handleOpenEdit = (emp: FormattedProfile) => {
    setEditingEmp(emp);
    setEditForm({
      fullName: emp.fullName,
      role: emp.role,
      designation: emp.designation,
      department: emp.department,
      employmentType: emp.employmentType,
      baseSalary: emp.salaryStructure.baseSalary,
      allowances: emp.salaryStructure.allowances,
      deductions: emp.salaryStructure.deductions,
    });
    setSaveSuccessMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    setIsSavingEmp(true);
    setSaveSuccessMsg(null);

    const res = await updateEmployee(editingEmp.id, {
      fullName: editForm.fullName,
      role: editForm.role,
      designation: editForm.designation,
      department: editForm.department,
      employmentType: editForm.employmentType,
      baseSalary: Number(editForm.baseSalary),
      allowances: Number(editForm.allowances),
      deductions: Number(editForm.deductions),
    });

    setIsSavingEmp(false);
    if (!res.error) {
      setSaveSuccessMsg('Employee profile updated successfully!');
      setTimeout(() => {
        setEditingEmp(null);
        setSaveSuccessMsg(null);
      }, 1200);
    }
  };

  const handleApproveLeave = async (id: string) => {
    await reviewLeave(id, 'approved', 'Approved by HR Administrator');
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeaveId) return;
    await reviewLeave(rejectingLeaveId, 'rejected', rejectComments || 'Rejected by HR Administrator');
    setRejectingLeaveId(null);
    setRejectComments('');
  };

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      emp.fullName.toLowerCase().includes(term) ||
      emp.employeeId.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.designation.toLowerCase().includes(term);

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/80 via-white to-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-semibold mb-1">
            <Shield className="w-3 h-3 text-brand-600" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Organization Overview
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            Managing records for {profile?.fullName || user?.email} • Human Resources & Operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            <Sparkles className="w-3 h-3 mr-1 text-brand-600" />
            Live Supabase Sync
          </Badge>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200 text-surface-700">
            {profile?.employeeId || 'ADMIN'}
          </span>
        </div>
      </motion.div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div onClick={() => setActiveTab('employees')} className="cursor-pointer">
          <MetricCard
            title="Total Employees"
            value={employeesLoading ? '...' : employees.length}
            description="Active team member profiles in database"
            icon={Users}
            trend={`${employees.length} members`}
            trendPositive={true}
            accentColor="brand"
            delayIndex={0}
          />
        </div>

        <div onClick={() => setActiveTab('leaves')} className="cursor-pointer">
          <MetricCard
            title="Pending Approvals"
            value={leavesLoading ? '...' : pendingCount}
            description="Time-off requests requiring HR review"
            icon={FileCheck}
            trend={pendingCount > 0 ? `${pendingCount} action needed` : 'All caught up'}
            trendPositive={pendingCount === 0}
            accentColor={pendingCount > 0 ? 'rose' : 'amber'}
            delayIndex={1}
          />
        </div>

        <div onClick={() => setActiveTab('attendance')} className="cursor-pointer">
          <MetricCard
            title="Today's Attendance"
            value={attendanceLoading ? '...' : `${todayPresentCount} Checked In`}
            description="Employees logged in for current shift"
            icon={UserCheck}
            trend={todayPresentCount > 0 ? 'Active' : 'Awaiting clock-in'}
            trendPositive={true}
            accentColor="emerald"
            delayIndex={2}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-surface-200 gap-2">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'employees'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-surface-100 text-surface-600 font-bold">
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'leaves'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Leave Approvals</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-rose-500 text-white font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'attendance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Today's Attendance Tracker</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-bold">
            {todayPresentCount} active
          </span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
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

          <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                    <th className="py-3 px-4 sm:px-6">Employee</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Salary (Net/Mo)</th>
                    <th className="py-3 px-4">Access Level</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-surface-500">
                        <Users className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                        <p className="font-medium text-sm text-surface-700">No employees found</p>
                        <p className="text-xs text-surface-400 mt-0.5">
                          Try adjusting search keywords or clearing filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const initials = getInitials(emp.fullName);
                      return (
                        <tr key={emp.id} className="hover:bg-surface-50/70 transition-colors group">
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

                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 border border-surface-200 text-surface-700">
                              {emp.employeeId}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-surface-900 font-medium">{emp.designation}</div>
                            <div className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-surface-400" />
                              {emp.department}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs text-surface-800">
                            {formatCurrency(emp.salaryStructure.netSalary)}
                          </td>

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

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-1.5 rounded-lg border border-surface-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-surface-600 transition-colors text-xs font-medium inline-flex items-center gap-1"
                                title="Edit employee information & salary"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <Link
                                href={`/dashboard/admin/employees/${emp.id}`}
                                className="p-1.5 rounded-lg border border-surface-200 hover:bg-surface-100 text-surface-600 hover:text-surface-900 transition-colors text-xs font-medium inline-flex items-center gap-1"
                                title="View full employee profile"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-4 sm:px-6 border-t border-surface-100 bg-surface-50/50 flex items-center justify-between text-xs text-surface-500">
              <span>Showing {filteredEmployees.length} of {employees.length} team members</span>
              <span className="font-medium text-emerald-600">Live Supabase Database Sync</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE APPROVALS */}
      {activeTab === 'leaves' && (
        <AdminLeaveReview
          leaves={allLeaves}
          isLoading={leavesLoading}
          onReview={reviewLeave}
          isReviewing={isReviewing}
        />
      )}

      {/* TAB 3: ATTENDANCE TRACKER */}
      {activeTab === 'attendance' && (
        <AdminAttendanceTracker
          attendance={allAttendance}
          isLoading={attendanceLoading}
          onRefresh={refetchAttendance}
        />
      )}

      {/* EDIT EMPLOYEE MODAL */}
      <AdminEditEmployeeModal
        employee={editingEmp}
        isOpen={!!editingEmp}
        onClose={() => setEditingEmp(null)}
        onSave={updateEmployee}
      />
    </div>
  );
}
