'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const { resendVerificationEmail, isConfigured } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!emailParam) return;
    setResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      const { error } = await resendVerificationEmail(emailParam);
      if (error) {
        setResendError(error.message);
      } else {
        setResendSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend';
      setResendError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-subtle">
        <Mail className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-surface-900">
          Verify your work email
        </h2>
        <p className="text-xs text-surface-600 leading-relaxed max-w-sm mx-auto">
          We&apos;ve sent a verification confirmation link to{' '}
          <span className="font-semibold text-surface-900 block mt-0.5 break-all">
            {emailParam || 'your registered email'}
          </span>
        </p>
      </div>

      {!isConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Developer note:</strong> Once real Supabase keys are provided in <code className="font-mono text-[11px]">.env.local</code>, Supabase sends confirmation emails automatically.
          </div>
        </div>
      )}

      {resendSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>New verification link dispatched successfully!</span>
        </div>
      )}

      {resendError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{resendError}</span>
        </div>
      )}

      <div className="bg-surface-50 p-4 rounded-xl border border-surface-100 text-xs text-surface-600 text-left space-y-2">
        <div className="font-semibold text-surface-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          Next Steps:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-surface-500 text-[11px]">
          <li>Open your email inbox and look for the Dayflow confirmation email.</li>
          <li>Click the verification button to confirm your account.</li>
          <li>Return to Dayflow and sign in with your credentials.</li>
        </ol>
      </div>

      <div className="pt-2 space-y-3">
        {emailParam && (
          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={handleResend}
            isLoading={resending}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Resend Verification Link
          </Button>
        )}

        <Link href="/signin" className="block w-full">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Proceed to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-surface-400">
          Loading verification info...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
