'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  IndianRupee,
  FileText,
  Shield,
  ArrowLeft,
  Edit3,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import { FormattedProfile } from '@/types/profile';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileViewProps {
  profile: FormattedProfile;
  backHref?: string;
  backLabel?: string;
}

export function ProfileView({
  profile: initialProfile,
  backHref = '/dashboard/employee',
  backLabel = 'Back to Dashboard',
}: ProfileViewProps) {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<FormattedProfile>(initialProfile);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const initials = getInitials(profile.fullName);
  const isOwner = user?.id === profile.id;

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await (supabase.from('profiles') as any)
        .update({
          phone: phone.trim() || null,
          address: address.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data) {
        setProfile({
          ...profile,
          phone: data.phone || 'Not provided',
          address: data.address || 'Not provided',
        });
        setSuccessMsg('Contact details updated successfully!');
        if (refreshProfile) refreshProfile();
        setTimeout(() => {
          setEditContactOpen(false);
          setSuccessMsg(null);
        }, 1000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link href={backHref}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-surface-600 hover:text-surface-900"
          >
            {backLabel}
          </Button>
        </Link>

        <Badge variant={profile.role === 'admin' ? 'primary' : 'neutral'} size="md">
          {profile.role === 'admin' ? (
            <>
              <Shield className="w-3.5 h-3.5 text-brand-600 mr-1" />
              HR Administrator
            </>
          ) : (
            'Employee Profile'
          )}
        </Badge>
      </div>

      {/* Header Profile Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-surface-200/90 bg-white shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-600 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-card border-2 border-white ring-4 ring-brand-50 shrink-0">
            {initials}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900">
                {profile.fullName}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-surface-100 border border-surface-200 text-surface-700">
                {profile.employeeId}
              </span>
            </div>

            <p className="text-sm font-medium text-surface-600 flex items-center gap-2">
              <span>{profile.designation}</span>
              <span>•</span>
              <span className="text-surface-500">{profile.department}</span>
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-surface-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-surface-400" />
                {profile.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-surface-400" />
                Joined {formatDate(profile.dateOfJoining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Personal Details & Job Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-surface-900">
                Personal & Contact Details
              </h3>
            </div>
            {isOwner && (
              <button
                onClick={() => setEditContactOpen(true)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Contact</span>
              </button>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-3.5 text-xs sm:text-sm">
            <div>
              <dt className="text-surface-500 font-normal">Full Name</dt>
              <dd className="text-surface-900 font-semibold mt-0.5">{profile.fullName}</dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Work Email</dt>
              <dd className="text-surface-900 font-medium mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-surface-400" />
                {profile.email}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Phone Number</dt>
              <dd className="text-surface-900 font-medium mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-surface-400" />
                {profile.phone}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Residential Address</dt>
              <dd className="text-surface-900 font-medium mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0 mt-0.5" />
                <span>{profile.address}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Job Details */}
        <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-surface-100">
            <Briefcase className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-surface-900">
              Employment Details
            </h3>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div>
              <dt className="text-surface-500 font-normal">Designation</dt>
              <dd className="text-surface-900 font-semibold mt-0.5">{profile.designation}</dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Department</dt>
              <dd className="text-surface-900 font-medium mt-0.5">{profile.department}</dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Employment Type</dt>
              <dd className="text-surface-900 font-medium mt-0.5">
                <Badge variant="neutral">{profile.employmentType}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Date of Joining</dt>
              <dd className="text-surface-900 font-medium mt-0.5">{formatDate(profile.dateOfJoining)}</dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">System Role</dt>
              <dd className="text-surface-900 font-medium mt-0.5 uppercase tracking-wider text-xs">
                {profile.role}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal">Employee Status</dt>
              <dd className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Active Employee
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Salary Structure Card */}
      <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-surface-100">
          <div className="flex items-center space-x-2">
            <IndianRupee className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-surface-900">
              Salary Structure (Monthly Compensation)
            </h3>
          </div>
          <span className="text-xs text-surface-500 font-normal">
            Currency: INR (₹)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200/60">
            <span className="text-xs text-surface-500">Base Salary</span>
            <div className="text-xl font-bold text-surface-900 mt-1">
              {formatCurrency(profile.salaryStructure.baseSalary)}
            </div>
            <span className="text-[11px] text-surface-400">Fixed basic component</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs text-emerald-700">Allowances (HRA + Special)</span>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              +{formatCurrency(profile.salaryStructure.allowances)}
            </div>
            <span className="text-[11px] text-emerald-600/80">Monthly additions</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs text-rose-700">Statutory Deductions (PF + Tax)</span>
            <div className="text-xl font-bold text-rose-900 mt-1">
              -{formatCurrency(profile.salaryStructure.deductions)}
            </div>
            <span className="text-[11px] text-rose-600/80">Monthly deductions</span>
          </div>
        </div>

        {/* Net Salary Summary banner */}
        <div className="p-4 rounded-xl bg-brand-50 border border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-800">
              Estimated Net Take-Home Salary
            </span>
            <p className="text-xs text-brand-600/90 mt-0.5">
              Base + Allowances - Deductions (Monthly Payroll Structure)
            </p>
          </div>
          <div className="text-2xl font-bold text-brand-900">
            {formatCurrency(profile.salaryStructure.netSalary)}
            <span className="text-xs font-normal text-brand-700 ml-1">/ month</span>
          </div>
        </div>
      </div>

      {/* EDIT CONTACT MODAL */}
      <AnimatePresence>
        {editContactOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-surface-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-surface-900">
                    Update Contact Details
                  </h3>
                  <p className="text-xs text-surface-500">
                    Update your phone number and residential address
                  </p>
                </div>
                <button
                  onClick={() => setEditContactOpen(false)}
                  className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="p-5 space-y-4 text-xs sm:text-sm">
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />

                <Input
                  label="Residential Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Indiranagar, Bangalore, KA"
                />

                <div className="pt-2 border-t border-surface-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setEditContactOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Save Contact
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
