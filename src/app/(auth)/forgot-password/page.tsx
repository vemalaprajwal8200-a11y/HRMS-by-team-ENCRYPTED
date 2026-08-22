'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your work email');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const configured = isSupabaseConfigured();
    if (!configured) {
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset link';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-surface-900">Reset Password</h2>
        <p className="text-xs text-surface-500 mt-1">
          Enter your registered email address and we&apos;ll send you a password recovery link.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Reset Link Sent
            </div>
            <p>
              If an account exists for <span className="font-semibold">{email}</span>, you will receive an email shortly with instructions to reset your password.
            </p>
          </div>

          <Link href="/signin" className="block">
            <Button variant="outline" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <Input
            label="Work Email"
            type="email"
            placeholder="alex.vance@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Recovery Link
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 hover:text-surface-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
