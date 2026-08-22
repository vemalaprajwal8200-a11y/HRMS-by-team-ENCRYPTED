'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Calendar,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaves } from '@/hooks/useLeaves';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { LeaveType } from '@/types/leave';

export default function LeavesPage() {
  const { profile } = useAuth();
  const { leaves, balances, isLoading, isSubmitting, error, applyLeave } = useLeaves();

  const [modalOpen, setModalOpen] = useState(false);
  const [formType, setFormType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) return 0;
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!startDate || !endDate) {
      setFormError('Please select both start date and end date.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    const res = await applyLeave({
      type: formType,
      startDate,
      endDate,
      remarks,
    });

    if (res.error) {
      setFormError(res.error.message);
    } else {
      setSuccessMsg('Leave application submitted! Awaiting HR review.');
      setTimeout(() => {
        setModalOpen(false);
        setStartDate('');
        setEndDate('');
        setRemarks('');
        setSuccessMsg(null);
      }, 1200);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/employee">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-surface-600 hover:text-surface-900"
          >
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
            Live Leave Management
          </Badge>
        </div>
      </div>

      {/* Hero Leave Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/70 via-white to-white shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
            <CalendarDays className="w-3.5 h-3.5 text-brand-600" />
            <span>Time Off & Approvals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
            Leave Ledger & Requests
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            Apply for vacation, sick time, or personal leaves and track real-time HR approval
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => {
            setModalOpen(true);
            setFormError(null);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm font-semibold"
        >
          Apply for Time Off
        </Button>
      </motion.div>

      {/* Quota Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-surface-200 bg-white shadow-card space-y-1">
          <span className="text-xs text-surface-500 font-medium">Casual Leave Quota</span>
          <div className="text-2xl font-bold text-surface-900">
            {balances.casual} <span className="text-xs font-normal text-surface-400">/ 12 days left</span>
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Personal & casual time</span>
        </div>

        <div className="p-4 rounded-xl border border-surface-200 bg-white shadow-card space-y-1">
          <span className="text-xs text-surface-500 font-medium">Sick Leave Quota</span>
          <div className="text-2xl font-bold text-surface-900">
            {balances.sick} <span className="text-xs font-normal text-surface-400">/ 10 days left</span>
          </div>
          <span className="text-[11px] text-rose-600 font-medium">Medical & health leaves</span>
        </div>

        <div className="p-4 rounded-xl border border-surface-200 bg-white shadow-card space-y-1">
          <span className="text-xs text-surface-500 font-medium">Paid / Earned Leave</span>
          <div className="text-2xl font-bold text-surface-900">
            {balances.paid} <span className="text-xs font-normal text-surface-400">/ 15 days left</span>
          </div>
          <span className="text-[11px] text-brand-600 font-medium">Annual earned vacation</span>
        </div>
      </div>

      {/* Leave Application History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-surface-900">
            My Leave Applications
          </h2>
          <span className="text-xs text-surface-500">
            Showing all submitted requests
          </span>
        </div>

        <div className="rounded-2xl border border-surface-200 bg-white shadow-card overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : leaves.length === 0 ? (
            <div className="py-16 text-center text-surface-500 space-y-2">
              <CalendarDays className="w-10 h-10 mx-auto text-surface-300" />
              <p className="font-semibold text-sm text-surface-800">No Leave Requests Found</p>
              <p className="text-xs text-surface-400">
                You haven&apos;t submitted any time-off requests yet. Click &quot;Apply for Time Off&quot; to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
                    <th className="py-3 px-4 sm:px-6">Leave Type</th>
                    <th className="py-3 px-4">Date Range</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason / Remarks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Reviewer Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <Badge
                          variant={
                            l.type === 'sick'
                              ? 'danger'
                              : l.type === 'casual'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                          className="capitalize font-semibold"
                        >
                          {l.type} Leave
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-surface-900">
                        {formatDate(l.startDate)} to {formatDate(l.endDate)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-surface-700">
                        {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-surface-600">
                        {l.remarks || <span className="text-surface-400 italic">None provided</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        {l.status === 'approved' && (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                          </Badge>
                        )}
                        {l.status === 'rejected' && (
                          <Badge variant="danger" size="sm">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </Badge>
                        )}
                        {l.status === 'pending' && (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" /> Under Review
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right text-xs text-surface-500">
                        {l.comments || (l.status === 'pending' ? 'Pending HR review' : 'No comments')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* APPLY FOR LEAVE MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-surface-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-surface-900">
                    Apply for Time Off
                  </h3>
                  <p className="text-xs text-surface-500">
                    Submit your leave request for manager approval
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApply} className="p-5 space-y-4 text-xs sm:text-sm">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <Select
                  label="Leave Type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as LeaveType)}
                  options={[
                    { label: `Casual Leave (${balances.casual} days available)`, value: 'casual' },
                    { label: `Sick Leave (${balances.sick} days available)`, value: 'sick' },
                    { label: `Paid / Earned Leave (${balances.paid} days available)`, value: 'paid' },
                    { label: 'Unpaid Leave / Loss of Pay', value: 'unpaid' },
                    { label: 'Maternity Leave', value: 'maternity' },
                    { label: 'Paternity Leave', value: 'paternity' },
                  ]}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                {startDate && endDate && (
                  <div className="p-2.5 bg-brand-50 rounded-xl border border-brand-100 text-brand-800 text-xs flex items-center justify-between">
                    <span>Total Duration:</span>
                    <span className="font-bold">{calculateDays()} days</span>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-surface-700">
                    Reason / Remarks (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the reason for time off..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder:text-surface-400"
                  />
                </div>

                <div className="pt-2 border-t border-surface-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Submit Application
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
