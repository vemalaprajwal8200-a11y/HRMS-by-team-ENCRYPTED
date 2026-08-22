import { Metadata } from 'next';
import { Suspense } from 'react';
import { SigninForm } from '@/components/auth/SigninForm';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = {
  title: 'Sign In — Dayflow HRMS',
  description: 'Sign in to access your Dayflow HRMS dashboard',
};

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <SigninForm />
    </Suspense>
  );
}
