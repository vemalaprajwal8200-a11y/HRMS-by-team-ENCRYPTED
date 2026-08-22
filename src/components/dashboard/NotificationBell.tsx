'use client';

import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; read: boolean }>>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { void fetch('/api/notifications/me').then((response) => response.ok ? response.json() : { notifications: [] }).then((result) => setNotifications(result.notifications)); }, []);
  const unread = notifications.filter((notification) => !notification.read).length;
  const markRead = async (id: string) => { await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }); setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification)); };
  return <div className="relative"><button type="button" aria-label="Notifications" onClick={() => setOpen(!open)} className="relative rounded-lg p-2 text-surface-600 hover:bg-surface-100"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-[10px] leading-4 text-white">{unread}</span>}</button>{open && <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-surface-200 bg-white p-2 shadow-card">{notifications.length === 0 ? <p className="p-3 text-xs text-surface-500">No notifications</p> : notifications.map((notification) => <button key={notification.id} type="button" onClick={() => !notification.read && void markRead(notification.id)} className={`flex w-full items-start gap-2 rounded-lg p-3 text-left text-xs hover:bg-surface-50 ${notification.read ? 'text-surface-500' : 'font-semibold text-surface-900'}`}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />{notification.message}</button>)}</div>}</div>;
}
