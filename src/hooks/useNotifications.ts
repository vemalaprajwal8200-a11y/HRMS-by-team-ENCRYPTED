'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { NotificationItem } from '@/types/leave';

interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

function buildDemoNotifications(): NotificationItem[] {
  return [
    {
      id: 'demo-ntf-1',
      userId: 'mock-user-123',
      message: 'Your sick leave for last week was approved',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-ntf-2',
      userId: 'mock-user-123',
      message: 'Welcome to Dayflow — your profile is complete.',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!configured) {
      setNotifications(buildDemoNotifications());
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/notifications/me', { method: 'GET' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load notifications.');
        setNotifications([]);
      } else {
        setNotifications((json.records as NotificationItem[]) || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      // Optimistic local update regardless of backend.
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (!configured) return;
      try {
        await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      } catch {
        /* non-fatal for the bell UX */
      }
    },
    [configured]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return { notifications, unreadCount, isLoading, error, markRead, refetch: fetchNotifications };
}
