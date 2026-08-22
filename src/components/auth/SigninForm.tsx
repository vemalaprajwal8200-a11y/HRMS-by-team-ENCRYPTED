'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Send, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SigninFormData, SigninFormErrors } from '@/types/auth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

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
        } else if (errorMsg.includes('user not found') || errorMsg.includes('no user')) {
          setErrors({ general: 'No registered user found with this email address.' });
        } else {
          setErrors({ general: result.error.message });
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
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-4"
      noValidate
    >
      {/* Header Headline */}
      <motion.div variants={itemVariants} className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-[11px] font-semibold text-brand-700 mb-1">
          <Sparkles className="w-3 h-3 text-brand-600" />
          <span>Secure Portal</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome to Dayflow
        </h2>
        <p className="text-xs text-slate-500">
          Enter your work email and password to access your dashboard
        </p>
      </motion.div>

      {/* Setup Warning if placeholder mode */}
      {!isConfigured && (
        <motion.div
          variants={itemVariants}
          className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-amber-900 text-xs flex gap-2.5 items-start backdrop-blur-sm"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Setup Tip:</span> Supabase keys in{' '}
            <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px] text-amber-900">.env.local</code> are placeholders. Once added, authentication with live database sync is active.
          </div>
        </motion.div>
      )}

      {/* Redirected Notice */}
      {redirectedFrom && (
        <motion.div
          variants={itemVariants}
          className="p-3 bg-brand-50/90 border border-brand-200/80 rounded-2xl text-brand-800 text-xs flex gap-2.5 items-center backdrop-blur-sm"
        >
          <AlertCircle className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Please sign in to access that protected page.</span>
        </motion.div>
      )}

      {/* General Error Notice */}
      {errors.general && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-rose-50/95 border border-rose-200/90 rounded-2xl text-rose-800 text-xs space-y-2 animate-in fade-in duration-150 backdrop-blur-sm"
        >
          <div className="flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errors.general}</span>
          </div>

          {errors.unverifiedEmail && (
            <div className="pt-2 border-t border-rose-200/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold text-rose-900 bg-white hover:bg-rose-50 border-rose-300 shadow-sm"
                onClick={handleResendVerification}
                isLoading={resendingEmail}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Resend Verification Email to {errors.unverifiedEmail}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Resend Success Notice */}
      {resendSuccess && (
        <motion.div
          variants={itemVariants}
          className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex gap-2.5 items-center animate-in fade-in duration-150 backdrop-blur-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>A new verification link has been sent to your email.</span>
        </motion.div>
      )}

      {/* Email Input */}
      <motion.div variants={itemVariants}>
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
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          required
        />
      </motion.div>

      {/* Password Input */}
      <motion.div variants={itemVariants}>
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
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />
        <div className="flex justify-end mt-1.5">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={itemVariants} className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-brand-500/20 font-semibold bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-700 hover:via-indigo-700 hover:to-violet-700 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-200"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In to Workspace
        </Button>
      </motion.div>

      {/* Switch to Sign Up */}
      <motion.div variants={itemVariants} className="pt-2 text-center">
        <p className="text-xs text-slate-600">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/signup"
            className="font-bold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-0.5 transition-colors"
          >
            <span>Create one</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </p>
      </motion.div>
    </motion.form>
  );
}
