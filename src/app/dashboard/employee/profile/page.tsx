'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileSkeleton } from '@/components/ui/Skeleton';

export default function EmployeeProfilePage() {
  const { profile, isLoading } = useAuth();

  if (isLoading || !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <ProfileView
      profile={profile}
      backHref="/dashboard/employee"
      backLabel="Back to Overview"
    />
  );
}
