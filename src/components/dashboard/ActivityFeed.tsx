'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Inbox, Sparkles } from 'lucide-react';

export function ActivityFeed() {
  const [items, setItems] = useState<Array<{ id: string; text: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [attendanceResponse, leaveResponse, notificationResponse] = await Promise.all([
        fetch('/api/attendance/me?range=weekly'),
        fetch('/api/leave-requests'),
        fetch('/api/notifications/me'),
      ]);
      if (!attendanceResponse.ok || !leaveResponse.ok || !notificationResponse.ok) throw new Error('Activity unavailable');
      const [attendance, leaves, notifications] = await Promise.all([
        attendanceResponse.json(), leaveResponse.json(), notificationResponse.json(),
      ]);
      const nextItems = [
        ...(attendance.records || []).filter((record: { check_in: string | null }) => record.check_in).slice(0, 3).map((record: { id: string; date: string; check_in: string }) => ({ id: `attendance-${record.id}`, text: `Attendance recorded for ${record.date}`, date: record.date })),
        ...((leaves.requests || []).slice(0, 2).map((request: { id: string; status: string; type: string; start_date: string }) => ({ id: `leave-${request.id}`, text: `${request.type} leave is ${request.status.toLowerCase()}`, date: request.start_date }))),
        ...((notifications.notifications || []).slice(0, 3).map((notification: { id: string; message: string; created_at: string }) => ({ id: `notification-${notification.id}`, text: notification.message, date: notification.created_at.slice(0, 10) }))),
      ];
      setItems(nextItems.slice(0, 6));
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card"
    >
      <div className="flex items-center justify-between pb-4 border-b border-surface-100">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-surface-500" />
          <h3 className="text-sm font-semibold text-surface-900">
            Recent Activity
          </h3>
        </div>
        <span className="text-[11px] font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
          Live feed
        </span>
      </div>

      {loading ? <div className="py-12 text-center text-sm text-surface-500">Loading recent activity...</div> : error ? <div className="py-12 text-center"><p className="text-sm text-rose-700">Could not load recent activity.</p><button onClick={() => void load()} className="mt-3 text-xs font-semibold text-brand-600 hover:underline">Retry</button></div> : items.length === 0 ? <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-50 border border-surface-200/60 flex items-center justify-center text-surface-400 mb-3 shadow-subtle">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-medium text-surface-800">
          No recent activity yet
        </h4>
        <p className="text-xs text-surface-500 max-w-sm mt-1 leading-relaxed">
          Your attendance logs, leave submissions, and profile updates will appear chronologically in this feed.
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-medium border border-brand-200/60">
          <Sparkles className="w-3 h-3 text-brand-600" />
          <span>All systems operational</span>
        </div>
      </div> : <div className="divide-y divide-surface-100">{items.map((item) => <div key={item.id} className="flex items-start gap-3 py-4"><div className="mt-1 h-2 w-2 rounded-full bg-brand-500 shrink-0" /><div><p className="text-sm text-surface-800">{item.text}</p><p className="text-xs text-surface-400 mt-1">{item.date}</p></div></div>)}</div>}
    </motion.div>
  );
}
