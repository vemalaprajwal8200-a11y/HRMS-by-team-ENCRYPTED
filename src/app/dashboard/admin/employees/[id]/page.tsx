'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useEmployeeProfile } from '@/hooks/useEmployees';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function AdminEmployeeProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const { profile, isLoading, error } = useEmployeeProfile(id);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-surface-900">Employee Not Found</h2>
        <p className="text-xs text-surface-500">
          The requested employee record could not be retrieved from the database.
        </p>
        <Link href="/dashboard/admin">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile}
      backHref="/dashboard/admin"
      backLabel="Back to Employee Directory"
    />
  );
}
