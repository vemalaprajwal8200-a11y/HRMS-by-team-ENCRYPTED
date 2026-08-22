'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { role, isConfigured } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordHasMinLen = password.length >= 8;
  const passwordHasNumber = /\d/.test(password);
  const passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordHasMinLen) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!passwordHasNumber) {
      newErrors.password = 'Password must include at least 1 number';
    } else if (!passwordHasSpecial) {
      newErrors.password = 'Password must include at least 1 special character';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    if (!isConfigured) {
      setErrors({ general: 'Supabase is not configured. Add your keys to .env.local to enable password updates.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrors({ general: error.message });
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/employee');
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setErrors({ general: message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white py-8 px-6 sm:px-8 border border-surface-200/90 rounded-2xl shadow-card">
        <h2 className="text-xl font-bold tracking-tight text-surface-900">Set a new password</h2>
        <p className="text-xs text-surface-500 mt-1">
          Choose a strong password for your Dayflow account.
        </p>

        {!isConfigured && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Setup Tip:</span> Supabase keys are in placeholder mode. Add them to{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> to enable live updates.
            </div>
          </div>
        )}

        {errors.general && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Password updated successfully. Redirecting you to your dashboard…</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <Input
            label="New Password"
            isPasswordToggle
            placeholder="Enter a new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          {password.length > 0 && (
            <div className="bg-surface-50 p-2.5 rounded-xl border border-surface-100 space-y-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px]">
                <span className={`flex items-center gap-1 ${passwordHasMinLen ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${passwordHasNumber ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 1+ number
                </span>
                <span className={`flex items-center gap-1 ${passwordHasSpecial ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 1+ special char
                </span>
              </div>
            </div>
          )}

          <Input
            label="Confirm New Password"
            isPasswordToggle
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
            }}
            error={errors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-sm"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>

          <Link
            href="/signin"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-surface-600 hover:text-surface-900 pt-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </form>
      </div>
    </div>
  );
}
