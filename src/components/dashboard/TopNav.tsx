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
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { getInitials } from '@/lib/utils';
import { NotificationsBell } from '@/components/dashboard/NotificationsBell';

export function TopNav() {
  const { user, profile, role, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = role === 'admin';
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Member';
  const displayEmail = profile?.email || user?.email || '';
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const navLinks = isAdmin
    ? [
        { label: 'Admin Overview', href: '/dashboard/admin', icon: LayoutDashboard },
        { label: 'Attendance', href: '/dashboard/admin/attendance', icon: ClipboardList },
        { label: 'Leave Approvals', href: '/dashboard/admin/leave', icon: CalendarDays },
        { label: 'Team Directory', href: '/dashboard/admin#employees', icon: Users },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard/employee', icon: LayoutDashboard },
        { label: 'My Profile', href: '/dashboard/employee/profile', icon: UserIcon },
        { label: 'Attendance', href: '/dashboard/employee/attendance', icon: CalendarCheck },
        { label: 'Leave Requests', href: '/dashboard/employee/leaves', icon: CalendarDays },
      ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-200 shadow-subtle">
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
            <div className="flex items-center space-x-3 pr-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="text-left leading-none">
                <div className="text-xs font-semibold text-surface-900 flex items-center gap-1.5">
                  {displayName}
                </div>
                <div className="text-[11px] text-surface-500 mt-0.5 truncate max-w-[150px]">
                  {displayEmail}
                </div>
              </div>
            </div>

            {!isAdmin && <NotificationsBell />}

            <div className="h-6 w-px bg-surface-200" />

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
