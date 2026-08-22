'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import {
  fetchEmployeeProfile,
  ApiError,
} from '@/lib/api/client';
import type { FormattedProfile } from '@/types/profile';

/**
 * Admin view/edit of any employee's profile. Data flows through the
 * admin-only API (/api/profile/[userId]) rather than direct Supabase reads,
 * so edits are validated by the same server-side allowlist the API enforces.
 */
export default function AdminEmployeeProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<FormattedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchEmployeeProfile(userId);
      setProfile(response.profile);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load this employee profile.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

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
          {error ||
            'The requested employee record could not be retrieved from the database.'}
        </p>
        <Link href="/dashboard/admin/employees">
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
      mode="admin-edit"
      backHref="/dashboard/admin/employees"
      backLabel="Back to Employee Directory"
      onSaved={(updated) => setProfile(updated)}
    />
  );
}
