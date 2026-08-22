'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileSkeleton } from '@/components/ui/Skeleton';

export default function EmployeeProfilePage() {
  const { profile, isLoading, refreshProfile } = useAuth();

  if (isLoading || !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <ProfileView
      profile={profile}
      mode="self-edit"
      backHref="/dashboard/employee"
      backLabel="Back to Overview"
      onSaved={() => {
        // Keep AuthContext (TopNav avatar/name, dashboard) in sync after save.
        refreshProfile();
      }}
    />
  );
}
