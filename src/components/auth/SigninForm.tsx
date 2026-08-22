'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SigninFormData, SigninFormErrors } from '@/types/auth';

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom');

  const { signIn, resendVerificationEmail, isConfigured } = useAuth();

  const [formData, setFormData] = useState<SigninFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<SigninFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: SigninFormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    setResendSuccess(false);

    try {
      const result = await signIn(formData);

      if (result.unverifiedEmail) {
        setErrors({
          unverifiedEmail: formData.email.trim(),
          general: 'Your email address has not been verified yet. Please check your inbox or resend the verification link.',
        });
        setIsSubmitting(false);
        return;
      }

      if (result.error) {
        const errorMsg = result.error.message.toLowerCase();
        if (errorMsg.includes('invalid login credentials') || errorMsg.includes('wrong password') || errorMsg.includes('invalid credentials')) {
          setErrors({ general: 'Invalid email or password. Please verify your credentials.' });
        } else {
          setErrors({ general: 'Invalid email or password. Please verify your credentials.' });
        }
        setIsSubmitting(false);
        return;
      }

      // Success: redirect based on role or original intended route
      if (redirectedFrom && redirectedFrom.startsWith('/dashboard')) {
        router.push(redirectedFrom);
      } else if (result.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/employee');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign in';
      setErrors({ general: message });
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!errors.unverifiedEmail) return;
    setResendingEmail(true);
    setResendSuccess(false);

    try {
      const { error } = await resendVerificationEmail(errors.unverifiedEmail);
      if (!error) {
        setResendSuccess(true);
      } else {
        setErrors({ ...errors, general: error.message });
      }
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-xl font-bold text-surface-900">Sign in to Dayflow</h2>
        <p className="text-xs text-surface-500 mt-1">
          Enter your work email and password to access your dashboard
        </p>
      </div>

      {!isConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Setup Tip:</span> Supabase keys in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> are placeholders. Once added, authentication with live database sync is active.
          </div>
        </div>
      )}

      {redirectedFrom && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-700 text-xs flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Please sign in to access that protected page.</span>
        </div>
      )}

      {errors.general && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>

          {errors.unverifiedEmail && (
            <div className="pt-1 border-t border-rose-200/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs text-rose-800 bg-white hover:bg-rose-50 border-rose-300"
                onClick={handleResendVerification}
                isLoading={resendingEmail}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Resend Verification Email to {errors.unverifiedEmail}
              </Button>
            </div>
          )}
        </div>
      )}

      {resendSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex gap-2 items-center animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>A new verification link has been sent to your email.</span>
        </div>
      )}

      {/* Email */}
      <Input
        label="Work Email"
        type="email"
        placeholder="alex.vance@company.com"
        value={formData.email}
        onChange={(e) => {
          setFormData({ ...formData, email: e.target.value });
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        error={errors.email}
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />

      {/* Password */}
      <div>
        <Input
          label="Password"
          isPasswordToggle
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: undefined });
          }}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />
        <div className="flex justify-end mt-1.5">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full shadow-sm"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </div>

      <p className="text-center text-xs text-surface-600 pt-2">
        Don&apos;t have an account yet?{' '}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
