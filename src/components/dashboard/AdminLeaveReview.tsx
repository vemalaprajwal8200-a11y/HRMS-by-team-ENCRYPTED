'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, CheckCircle2, XCircle, Clock, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { AdminLeaveItem } from '@/hooks/useLeaves';

interface AdminLeaveReviewProps {
  leaves: AdminLeaveItem[];
  isLoading: boolean;
  onReview: (id: string, action: 'approved' | 'rejected', comments?: string) => Promise<any>;
  isReviewing: boolean;
}

export function AdminLeaveReview({
  leaves,
  isLoading,
  onReview,
  isReviewing,
}: AdminLeaveReviewProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [comments, setComments] = useState('');

  const handleApprove = (id: string) => {
    onReview(id, 'approved', 'Approved by HR Administrator');
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    await onReview(rejectingId, 'rejected', comments || 'Rejected by HR Administrator');
    setRejectingId(null);
    setComments('');
  };

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  if (leaves.length === 0) {
    return (
      <div className="py-16 text-center text-surface-500 space-y-2 bg-white rounded-2xl border border-surface-200 shadow-card">
        <FileCheck className="w-10 h-10 mx-auto text-surface-300" />
        <p className="font-semibold text-sm text-surface-800">No Leave Requests Found</p>
        <p className="text-xs text-surface-400">
          When employees apply for time off, requests will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-200/90 bg-white shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-semibold uppercase tracking-wider text-surface-500 select-none">
              <th className="py-3 px-4 sm:px-6">Employee</th>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Dates & Duration</th>
              <th className="py-3 px-4">Remarks / Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-surface-50/70 transition-colors">
                <td className="py-3.5 px-4 sm:px-6">
                  <div className="font-semibold text-surface-900">{leave.employeeName}</div>
                  <div className="text-[11px] text-surface-500">{leave.employeeId} • {leave.department}</div>
                </td>

                <td className="py-3.5 px-4">
                  <Badge
                    variant={
                      leave.type === 'sick'
                        ? 'danger'
                        : leave.type === 'casual'
                        ? 'warning'
                        : 'primary'
                    }
                    size="sm"
                    className="capitalize font-semibold"
                  >
                    {leave.type} Leave
                  </Badge>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-medium text-surface-900">
                    {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                  </div>
                  <div className="text-[11px] text-surface-500 mt-0.5">
                    {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                  </div>
                </td>

                <td className="py-3.5 px-4 max-w-xs truncate text-surface-700">
                  {leave.remarks || <span className="text-surface-400 italic">None provided</span>}
                </td>

                <td className="py-3.5 px-4">
                  {leave.status === 'approved' && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                    </Badge>
                  )}
                  {leave.status === 'rejected' && (
                    <Badge variant="danger" size="sm">
                      <XCircle className="w-3 h-3 mr-1" /> Rejected
                    </Badge>
                  )}
                  {leave.status === 'pending' && (
                    <Badge variant="warning" size="sm">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                  )}
                </td>

                <td className="py-3.5 px-4 sm:px-6 text-right">
                  {leave.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(leave.id)}
                        isLoading={isReviewing}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => {
                          setRejectingId(leave.id);
                          setComments('');
                        }}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-surface-400">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-surface-200 w-full max-w-md p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-surface-900">
                  Reject Leave Request
                </h3>
              </div>

              <p className="text-xs text-surface-600">
                Provide feedback or reasoning for rejecting this request:
              </p>

              <textarea
                rows={3}
                placeholder="e.g. High workload this week, please re-apply for next Monday..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-surface-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={handleConfirmReject}
                  isLoading={isReviewing}
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
