'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  IndianRupee,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { getInitials } from '@/lib/utils';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

export function TopNav() {
  const { user, profile, role, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);

  const isAdmin = role === 'admin';
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Member';
  const displayEmail = profile?.email || user?.email || '';
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const refreshAttendance = async () => {
    const response = await fetch('/api/attendance/me?range=daily');
    if (!response.ok) return;
    const result = await response.json();
    setCheckedInAt(result.records?.[0]?.check_in || null);
  };

  React.useEffect(() => { void refreshAttendance(); }, []);

  const toggleAttendance = async () => {
    setAttendanceBusy(true);
    const endpoint = checkedInAt ? 'check-out' : 'check-in';
    const response = await fetch(`/api/attendance/${endpoint}`, { method: 'POST' });
    if (response.ok) {
      const result = await response.json();
      setCheckedInAt(result.record?.check_in || null);
      if (endpoint === 'check-out') setCheckedInAt(null);
    }
    setAttendanceBusy(false);
  };

  const navLinks = isAdmin
    ? [
        { label: 'Employees', href: '/dashboard/admin', icon: Users },
        { label: 'Attendance', href: '/dashboard/admin/attendance', icon: CalendarCheck },
        { label: 'Time Off', href: '/dashboard/admin/leave', icon: CalendarDays },
        { label: 'Allocation', href: '/dashboard/admin/allocation', icon: CalendarDays },
      ]
    : [
        { label: 'Employees', href: '/dashboard/employee', icon: Users },
        { label: 'Attendance', href: '/dashboard/employee/attendance', icon: CalendarCheck },
        { label: 'Time Off', href: '/dashboard/employee/leaves', icon: CalendarDays },
      ];

  return (
    <header className="sticky top-0 z-30 bg-[#171721]/95 backdrop-blur-md border-b border-[#303044] shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Left Nav */}
          <div className="flex items-center space-x-8">
            <Link
              href={isAdmin ? '/dashboard/admin' : '/dashboard/employee'}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-700 transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-surface-900">
                  Dayflow<span className="text-brand-600">.</span>
                </span>
                {isAdmin ? (
                  <Badge variant="primary" size="sm" className="font-semibold">
                    <Shield className="w-3 h-3 text-brand-600" /> Admin
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    Workspace
                  </Badge>
                )}
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-100 text-surface-900 font-semibold'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right User Nav & Sign Out */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${checkedInAt ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <button type="button" disabled={attendanceBusy} onClick={() => void toggleAttendance()} className="rounded-lg border border-[#3a3a50] px-2.5 py-1.5 text-xs text-surface-700 hover:border-brand-500 hover:text-white">
                {checkedInAt ? `Since ${new Date(checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Check In'} <ArrowRight className="ml-1 inline h-3 w-3" />
              </button>
            </div>
            <NotificationBell />
            <div className="flex items-center space-x-3 pr-2">
              <button type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </button>
              <div className="text-left leading-none">
                <div className="text-xs font-semibold text-surface-900 flex items-center gap-1.5">
                  {displayName}
                </div>
                <div className="text-[11px] text-surface-500 mt-0.5 truncate max-w-[150px]">
                  {displayEmail}
                </div>
              </div>
            </div>

            <div className="relative"><button type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="text-surface-600"><ChevronDown className="h-3.5 w-3.5" /></button>{profileMenuOpen && <div className="absolute right-0 top-7 z-50 w-36 rounded-lg border border-[#3a3a50] bg-[#1b1b27] p-1 shadow-xl"><Link href="/dashboard/employee/profile" className="block rounded px-3 py-2 text-xs text-surface-700 hover:bg-[#29293a]">My Profile</Link><button onClick={() => void handleSignOut()} className="block w-full rounded px-3 py-2 text-left text-xs text-rose-300 hover:bg-[#29293a]">Log Out</button></div>}</div>

            <div className="h-6 w-px bg-[#303044]" />

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-surface-200 bg-white px-4 pt-3 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center space-x-3 p-2 bg-surface-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
            <div>
              <div className="text-xs font-semibold text-surface-900">{displayName}</div>
              <div className="text-[11px] text-surface-500 truncate max-w-[200px]">{displayEmail}</div>
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-surface-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
