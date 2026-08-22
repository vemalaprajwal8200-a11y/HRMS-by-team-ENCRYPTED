'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Shield,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SignupFormData, SignupFormErrors } from '@/types/auth';
import { UserRole } from '@/types/database';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function SignupForm() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    employeeId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });

  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password criteria validation
  const passwordHasMinLen = formData.password.length >= 8;
  const passwordHasNumber = /\d/.test(formData.password);
  const passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const validate = (): boolean => {
    const newErrors: SignupFormErrors = {};

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required (e.g. EMP-101)';
    } else if (formData.employeeId.trim().length < 3) {
      newErrors.employeeId = 'Employee ID must be at least 3 characters';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Work email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordHasMinLen) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!passwordHasNumber) {
      newErrors.password = 'Password must include at least 1 number';
    } else if (!passwordHasSpecial) {
      newErrors.password = 'Password must include at least 1 special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
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

    try {
      const result = await signUp(formData);

      if (result.error) {
        setErrors({ general: result.error.message });
        setIsSubmitting(false);
        return;
      }

      // Success: redirect to verify-email holding page
      const encodedEmail = encodeURIComponent(formData.email.trim());
      router.push(`/verify-email?email=${encodedEmail}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during signup';
      setErrors({ general: message });
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-3.5"
      noValidate
    >
      {/* Header Headline */}
      <motion.div variants={itemVariants} className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-[11px] font-semibold text-brand-700 mb-1">
          <Sparkles className="w-3 h-3 text-brand-600" />
          <span>New Account</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="text-xs text-slate-500">
          Join Dayflow HRMS to access your workspace
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
            <span className="font-semibold text-amber-950">Setup Tip:</span> Supabase keys are in placeholder mode. Update{' '}
            <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px] text-amber-900">.env.local</code> with your project credentials to enable live database writes.
          </div>
        </motion.div>
      )}

      {/* General Error Notice */}
      {errors.general && (
        <motion.div
          variants={itemVariants}
          className="p-3 bg-rose-50/95 border border-rose-200/90 rounded-2xl text-rose-800 text-xs flex gap-2.5 items-start animate-in fade-in duration-150 backdrop-blur-sm"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{errors.general}</span>
        </motion.div>
      )}

      {/* Employee ID & Role */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Employee ID"
          placeholder="e.g. EMP-104"
          value={formData.employeeId}
          onChange={(e) => {
            setFormData({ ...formData, employeeId: e.target.value });
            if (errors.employeeId) setErrors({ ...errors, employeeId: undefined });
          }}
          error={errors.employeeId}
          leftIcon={<BadgeCheck className="w-4 h-4 text-slate-400" />}
          required
        />

        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => {
            setFormData({ ...formData, role: e.target.value as UserRole });
            if (errors.role) setErrors({ ...errors, role: undefined });
          }}
          error={errors.role}
          options={[
            { label: 'Employee', value: 'employee' },
            { label: 'HR Administrator', value: 'admin' },
          ]}
        />
      </motion.div>

      {/* Full Name */}
      <motion.div variants={itemVariants}>
        <Input
          label="Full Name"
          placeholder="e.g. Alex Vance"
          value={formData.fullName}
          onChange={(e) => {
            setFormData({ ...formData, fullName: e.target.value });
            if (errors.fullName) setErrors({ ...errors, fullName: undefined });
          }}
          error={errors.fullName}
          leftIcon={<User className="w-4 h-4 text-slate-400" />}
          required
        />
      </motion.div>

      {/* Email */}
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

      {/* Password */}
      <motion.div variants={itemVariants}>
        <Input
          label="Password"
          isPasswordToggle
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: undefined });
          }}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />
      </motion.div>

      {/* Password criteria checklist */}
      {formData.password.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80 space-y-1 text-xs backdrop-blur-sm"
        >
          <div className="text-[11px] font-medium text-slate-500">Password requirements:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px]">
            <span className={`flex items-center gap-1 ${passwordHasMinLen ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 8+ chars
            </span>
            <span className={`flex items-center gap-1 ${passwordHasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 1+ number
            </span>
            <span className={`flex items-center gap-1 ${passwordHasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 1+ symbol
            </span>
          </div>
        </motion.div>
      )}

      {/* Confirm Password */}
      <motion.div variants={itemVariants}>
        <Input
          label="Confirm Password"
          isPasswordToggle
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
          }}
          error={errors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={itemVariants} className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-brand-500/20 font-semibold bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-700 hover:via-indigo-700 hover:to-violet-700 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-200"
          isLoading={isSubmitting}
          leftIcon={<Shield className="w-4 h-4" />}
        >
          Create Account & Verify
        </Button>
      </motion.div>

      {/* Switch to Sign In */}
      <motion.div variants={itemVariants} className="pt-1 text-center">
        <p className="text-xs text-slate-600">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="font-bold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-0.5 transition-colors"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </p>
      </motion.div>
    </motion.form>
  );
}
