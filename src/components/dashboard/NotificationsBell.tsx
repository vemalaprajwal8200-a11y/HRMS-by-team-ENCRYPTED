'use client';

import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '';
  }
}

export function NotificationsBell() {
  const { notifications, unreadCount, isLoading, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(0, 6);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative p-2 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] z-40 rounded-2xl border border-surface-200 bg-white shadow-elevated overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-600">Notifications</span>
              <span className="text-[11px] text-surface-400">{unreadCount} unread</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-xs text-surface-400">Loading…</div>
              ) : recent.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-surface-500">
                  You&apos;re all caught up.
                </div>
              ) : (
                recent.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-surface-100 last:border-0 transition-colors hover:bg-surface-50 flex gap-2.5',
                      !n.read && 'bg-brand-50/40'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1 w-2 h-2 rounded-full shrink-0',
                        n.read ? 'bg-surface-300' : 'bg-brand-500'
                      )}
                    />
                    <span className="flex-1">
                      <span className="block text-xs text-surface-700 leading-snug">{n.message}</span>
                      <span className="block text-[10px] text-surface-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            {unreadCount > 0 && (
              <div className="px-4 py-2 border-t border-surface-100">
                <span className="inline-flex items-center gap-1 text-[11px] text-surface-500">
                  <CheckCheck className="w-3.5 h-3.5" /> Tap a notification to mark it read
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
