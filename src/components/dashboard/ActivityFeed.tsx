'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CalendarCheck, CalendarDays, CheckCircle2, XCircle, Inbox, Sparkles } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useLeaves } from '@/hooks/useLeaves';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function ActivityFeed() {
  const { history } = useAttendance();
  const { leaves } = useLeaves();

  // Combine attendance logs and leaves into a unified activity feed
  const activities: Array<{
    id: string;
    type: 'attendance' | 'leave';
    title: string;
    time: string;
    status: string;
    badgeVariant: 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
    icon: any;
  }> = [];

  history.slice(0, 3).forEach((att) => {
    activities.push({
      id: `att-${att.id}`,
      type: 'attendance',
      title: att.checkOut ? `Full shift completed on ${formatDate(att.date)}` : `Checked in on ${formatDate(att.date)}`,
      time: att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : att.date,
      status: att.checkOut ? `${att.workHours || 0} hrs logged` : 'Active Shift',
      badgeVariant: att.status === 'PRESENT' ? 'success' : 'neutral',
      icon: CalendarCheck,
    });
  });

  leaves.slice(0, 3).forEach((l) => {
    activities.push({
      id: `leave-${l.id}`,
      type: 'leave',
      title: `${l.type.toUpperCase()} Leave: ${formatDate(l.startDate)} - ${formatDate(l.endDate)}`,
      time: formatDate(l.createdAt),
      status: l.status === 'APPROVED' ? 'Approved' : l.status === 'REJECTED' ? 'Rejected' : 'Under Review',
      badgeVariant: l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning',
      icon: CalendarDays,
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-surface-100">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-surface-900">
            Recent Timeline Activity
          </h3>
        </div>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Live sync
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-50 border border-surface-200/60 flex items-center justify-center text-surface-400 mb-3 shadow-subtle">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-medium text-surface-800">
            No recent activities logged
          </h4>
          <p className="text-xs text-surface-500 max-w-sm mt-1 leading-relaxed">
            Your attendance clock-ins, leave submissions, and status updates will appear chronologically in this feed.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-surface-100">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-100 text-surface-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-surface-900">{act.title}</div>
                    <div className="text-[11px] text-surface-500">{act.time}</div>
                  </div>
                </div>

                <Badge variant={act.badgeVariant} size="sm">
                  {act.status}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
