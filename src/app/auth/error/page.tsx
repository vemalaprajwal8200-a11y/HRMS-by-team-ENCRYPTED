'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Mail, RefreshCw, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const { resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      const { error } = await resendVerificationEmail(email.trim());
      if (error) {
        setResendError(error.message);
      } else {
        setResendSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend email';
      setResendError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-subtle">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-surface-900">
          Verification Link Expired or Invalid
        </h2>
        <p className="text-xs text-surface-600 leading-relaxed max-w-sm mx-auto">
          The email confirmation link may have expired, already been used, or was invalid.
          Enter your email below to receive a fresh verification link.
        </p>
      </div>

      {resendSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>A fresh verification link has been dispatched to your email!</span>
        </div>
      )}

      {resendError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{resendError}</span>
        </div>
      )}

      <form onSubmit={handleResend} className="space-y-3 text-left">
        <Input
          label="Your Work Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={resending}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Resend Verification Link
        </Button>
      </form>

      <div className="pt-2 border-t border-surface-100">
        <Link href="/signin" className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-card group-hover:bg-brand-700 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-surface-900">
            Dayflow<span className="text-brand-600">.</span>
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-surface-200/90 rounded-2xl shadow-card">
          <Suspense fallback={<div className="p-8 text-center text-xs text-surface-400">Loading...</div>}>
            <AuthErrorContent />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-surface-500">
          Dayflow HRMS • Secure Authentication
        </p>
      </div>
    </div>
  );
}
