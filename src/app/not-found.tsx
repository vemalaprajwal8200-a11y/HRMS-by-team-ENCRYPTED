'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-surface-200 shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-surface-100 text-surface-600 flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-surface-900">
            Page Not Found
          </h2>
          <p className="text-sm text-surface-500">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
