'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserRole } from '@/types/database';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, role, isLoading, isConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // If Supabase is configured and no user is logged in
    if (isConfigured && !user) {
      router.replace(`/signin?redirectedFrom=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based route guard
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === 'admin') {
        router.replace('/dashboard/admin');
      } else {
        router.replace('/dashboard/employee');
      }
    }
  }, [user, role, isLoading, isConfigured, allowedRoles, pathname, router]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  // Render children once verified
  return <>{children}</>;
}
