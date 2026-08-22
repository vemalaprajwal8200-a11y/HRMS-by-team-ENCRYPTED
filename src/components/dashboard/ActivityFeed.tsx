'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Inbox, Sparkles } from 'lucide-react';

export function ActivityFeed() {
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

      <div className="py-12 flex flex-col items-center justify-center text-center">
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
      </div>
    </motion.div>
  );
}
