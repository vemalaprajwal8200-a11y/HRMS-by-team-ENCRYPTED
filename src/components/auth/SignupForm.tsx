'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Shield, AlertCircle, CheckCircle2, Phone, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SignupFormData, SignupFormErrors } from '@/types/auth';
import { isValidPassword } from '@/lib/auth/password';

export function SignupForm() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    employeeId: 'ADMIN',
    companyName: '',
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
  });

  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password criteria validation
  const passwordHasMinLen = formData.password.length >= 8;
  const passwordHasNumber = /\d/.test(formData.password);
  const passwordHasUppercase = /[A-Z]/.test(formData.password);
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const validate = (): boolean => {
    const newErrors: SignupFormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

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
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Password must include at least 1 uppercase letter';
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-xl font-bold text-surface-900">Register your company</h2>
        <p className="text-xs text-surface-500 mt-1">
          Company administrators create the workspace. Employees are added by HR after setup.
        </p>
      </div>

      {!isConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Setup Tip:</span> Supabase keys are in placeholder mode. Update{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> with your project credentials to enable live database writes.
          </div>
        </div>
      )}

      {errors.general && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex gap-2 items-start animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Company Name"
          placeholder="e.g. Dayflow Labs"
          value={formData.companyName}
          onChange={(e) => {
            setFormData({ ...formData, companyName: e.target.value });
            if (errors.companyName) setErrors({ ...errors, companyName: undefined });
          }}
          error={errors.companyName}
          leftIcon={<Building2 className="w-4 h-4" />}
          required
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+91 98765 43210"
          value={formData.phone}
          onChange={(e) => {
            setFormData({ ...formData, phone: e.target.value });
            if (errors.phone) setErrors({ ...errors, phone: undefined });
          }}
          error={errors.phone}
          leftIcon={<Phone className="w-4 h-4" />}
          required
        />
      </div>

      {/* Full Name */}
      <Input
        label="Admin Name"
        placeholder="e.g. Alex Vance"
        value={formData.fullName}
        onChange={(e) => {
          setFormData({ ...formData, fullName: e.target.value });
          if (errors.fullName) setErrors({ ...errors, fullName: undefined });
        }}
        error={errors.fullName}
        leftIcon={<User className="w-4 h-4" />}
        required
      />

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
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />

      {/* Password criteria checklist */}
      {formData.password.length > 0 && (
        <div className="bg-surface-50 p-2.5 rounded-xl border border-surface-100 space-y-1 text-xs">
          <div className="text-[11px] font-medium text-surface-500">Password requirements:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px]">
            <span className={`flex items-center gap-1 ${passwordHasMinLen ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 8+ chars
            </span>
            <span className={`flex items-center gap-1 ${passwordHasNumber ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 1+ number
            </span>
            <span className={`flex items-center gap-1 ${passwordHasUppercase ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 1+ uppercase
            </span>
          </div>
        </div>
      )}

      {/* Confirm Password */}
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
          leftIcon={<Shield className="w-4 h-4" />}
        >
          Create Account & Verify
        </Button>
      </div>

      <p className="text-center text-xs text-surface-600 pt-2">
        Already have an account?{' '}
        <Link href="/signin" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}
