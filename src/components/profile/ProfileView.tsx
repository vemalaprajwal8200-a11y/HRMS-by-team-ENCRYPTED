'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  IndianRupee,
  FileText,
  Shield,
  ArrowLeft,
  Lock,
  X,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  FormattedProfile,
  DocumentItem,
} from '@/types/profile';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/profile/Avatar';
import {
  formatCurrency,
  formatDate,
} from '@/lib/utils';
import {
  patchMyProfile,
  patchEmployeeProfile,
  ApiError,
} from '@/lib/api/client';

type ProfileMode = 'view' | 'self-edit' | 'admin-edit';

interface ProfileViewProps {
  profile: FormattedProfile;
  mode?: ProfileMode;
  backHref?: string;
  backLabel?: string;
  /** Called after a successful PATCH with the fresh profile row. */
  onSaved?: (profile: FormattedProfile) => void;
}

const EMPTY_DOC_FORM = { name: '', url: '' };

export function ProfileView({
  profile,
  mode = 'view',
  backHref = '/dashboard/employee',
  backLabel = 'Back to Dashboard',
  onSaved,
}: ProfileViewProps) {
  const isEditing = mode !== 'view';
  const isAdminEdit = mode === 'admin-edit';

  const [isEditingNow, setIsEditingNow] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);

  // Draft form state (strings as typed by the user).
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone === 'Not provided' ? '' : profile.phone);
  const [address, setAddress] = useState(profile.address === 'Not provided' ? '' : profile.address);
  const [designation, setDesignation] = useState(profile.designation);
  const [department, setDepartment] = useState(profile.department);
  const [dateOfJoining, setDateOfJoining] = useState(profile.dateOfJoining);
  const [employmentType, setEmploymentType] = useState(profile.employmentType);

  // Photo is uploaded immediately to Cloudinary, then persisted on Save.
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | undefined>(undefined);

  // Documents (admin-managed).
  const [documents, setDocuments] = useState<DocumentItem[]>(profile.documents);
  const [docForm, setDocForm] = useState(EMPTY_DOC_FORM);
  const [docError, setDocError] = useState<string | null>(null);

  // Re-sync drafts whenever the underlying profile changes or edit mode starts.
  useEffect(() => {
    setFullName(profile.fullName);
    setPhone(profile.phone === 'Not provided' ? '' : profile.phone);
    setAddress(profile.address === 'Not provided' ? '' : profile.address);
    setDesignation(profile.designation);
    setDepartment(profile.department);
    setDateOfJoining(profile.dateOfJoining);
    setEmploymentType(profile.employmentType);
    setDocuments(profile.documents);
    setPendingPhotoUrl(undefined);
    setSaveError(null);
    setRejectedFields([]);
    setDocForm(EMPTY_DOC_FORM);
    setDocError(null);
  }, [profile]);

  const effectivePhotoUrl = pendingPhotoUrl ?? profile.photoUrl;

  const handleCancel = () => {
    setIsEditingNow(false);
    setSaveError(null);
    setRejectedFields([]);
    setPendingPhotoUrl(undefined);
    setFullName(profile.fullName);
    setPhone(profile.phone === 'Not provided' ? '' : profile.phone);
    setAddress(profile.address === 'Not provided' ? '' : profile.address);
    setDesignation(profile.designation);
    setDepartment(profile.department);
    setDateOfJoining(profile.dateOfJoining);
    setEmploymentType(profile.employmentType);
    setDocuments(profile.documents);
    setDocForm(EMPTY_DOC_FORM);
    setDocError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setRejectedFields([]);

    try {
      let updated: FormattedProfile;

      if (isAdminEdit) {
        const response = await patchEmployeeProfile(profile.id, {
          full_name: fullName.trim() || profile.fullName,
          phone: phone.trim(),
          address: address.trim(),
          designation: designation.trim() || profile.designation,
          department: department.trim() || profile.department,
          date_of_joining: dateOfJoining,
          employment_type: employmentType,
          photo_url: effectivePhotoUrl ?? '',
          documents,
        });
        updated = response.profile;
      } else {
        const response = await patchMyProfile({
          phone: phone.trim(),
          address: address.trim(),
          photo_url: effectivePhotoUrl ?? '',
        });
        updated = response.profile;
      }

      setIsEditingNow(false);
      onSaved?.(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
        setRejectedFields(err.rejectedFields ?? []);
      } else {
        setSaveError('Something went wrong while saving. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDocument = () => {
    setDocError(null);
    const name = docForm.name.trim();
    const url = docForm.url.trim();

    if (!name) {
      setDocError('Give the document a name.');
      return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
      setDocError('URL must start with http:// or https://');
      return;
    }
    if (documents.length >= 25) {
      setDocError('Maximum of 25 documents per profile.');
      return;
    }

    setDocuments([
      ...documents,
      {
        id: `doc-${Date.now()}`,
        name,
        url,
        uploadedAt: new Date().toISOString(),
        category: 'other',
      },
    ]);
    setDocForm(EMPTY_DOC_FORM);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
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
      </div>

      {/* Server-side rejection banner — proof the allowlist boundary is real */}
      {saveError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 space-y-1.5">
          <div className="flex items-start gap-2 text-xs text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
          {rejectedFields.length > 0 && (
            <p className="text-xs text-rose-700 pl-6">
              Rejected fields:{' '}
              {rejectedFields.map((field) => (
                <span key={field} className="font-mono font-semibold mr-1.5 px-1.5 py-0.5 rounded bg-white border border-rose-200 inline-block">
                  {field}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* Header Profile Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-surface-200/90 bg-white shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          <Avatar
            name={profile.fullName}
            photoUrl={effectivePhotoUrl}
            size="xl"
            onUpload={isEditingNow && !isSaving ? setPendingPhotoUrl : undefined}
          />

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

          {/* Save / Cancel actions in header for visibility while editing */}
          {isEditingNow && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Personal Details & Job Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-surface-900">Personal Details</h3>
            </div>
            {!isAdminEdit && isEditingNow && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Some fields managed by HR
              </span>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-3.5 text-xs sm:text-sm">
            {/* Full Name: admin-editable, otherwise locked */}
            <div>
              <dt className="text-surface-500 font-normal mb-1">Full Name</dt>
              <dd>
                {isAdminEdit && isEditingNow ? (
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                ) : (
                  <ManagedField>{profile.fullName}</ManagedField>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-surface-500 font-normal mb-1">Work Email</dt>
              <dd>
                <ManagedField icon={<Mail className="w-3.5 h-3.5 text-surface-400" />}>
                  {profile.email}
                </ManagedField>
              </dd>
            </div>

            {/* Phone: editable by both self and admin */}
            <div>
              <dt className="text-surface-500 font-normal mb-1">Phone Number</dt>
              <dd>
                {isEditingNow ? (
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <EditableValue icon={<Phone className="w-3.5 h-3.5 text-surface-400" />}>
                    {profile.phone}
                  </EditableValue>
                )}
              </dd>
            </div>

            {/* Address: editable by both self and admin */}
            <div>
              <dt className="text-surface-500 font-normal mb-1">Residential Address</dt>
              <dd>
                {isEditingNow ? (
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, locality, city, PIN code"
                    className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-colors resize-none"
                  />
                ) : (
                  <EditableValue icon={<MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0 mt-0.5" />}>
                    {profile.address}
                  </EditableValue>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Job Details */}
        <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-surface-900">Employment Details</h3>
            </div>
            {!isAdminEdit && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Admin-managed
              </span>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div className="sm:col-span-2">
              <dt className="text-surface-500 font-normal mb-1">Designation</dt>
              <dd>
                {isAdminEdit && isEditingNow ? (
                  <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Job title" />
                ) : (
                  <ManagedField>{profile.designation}</ManagedField>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-surface-500 font-normal mb-1">Department</dt>
              <dd>
                {isAdminEdit && isEditingNow ? (
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
                ) : (
                  <ManagedField
                    icon={<Building className="w-3.5 h-3.5 text-surface-400" />}
                  >
                    {profile.department}
                  </ManagedField>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal mb-1">Employment Type</dt>
              <dd>
                {isAdminEdit && isEditingNow ? (
                  <Select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    options={[
                      { label: 'Full-time', value: 'Full-time' },
                      { label: 'Part-time', value: 'Part-time' },
                      { label: 'Contract', value: 'Contract' },
                      { label: 'Intern', value: 'Intern' },
                    ]}
                  />
                ) : (
                  <ManagedField>
                    <Badge variant="neutral">{profile.employmentType}</Badge>
                  </ManagedField>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500 font-normal mb-1">Date of Joining</dt>
              <dd>
                {isAdminEdit && isEditingNow ? (
                  <Input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                  />
                ) : (
                  <ManagedField>{formatDate(profile.dateOfJoining)}</ManagedField>
                )}
              </dd>
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

      {/* Salary Structure Card — READ-ONLY for everyone this phase */}
      <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-surface-100">
          <div className="flex items-center space-x-2">
            <IndianRupee className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-surface-900">
              Salary Structure (Monthly Compensation)
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" /> Payroll-owned • Phase 5
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

        <div className="p-4 rounded-xl bg-brand-50 border border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-800">
              Estimated Net Take-Home Salary
            </span>
            <p className="text-xs text-brand-600/90 mt-0.5">
              Base + Allowances - Deductions (Phase 5 Payroll Integration Ready)
            </p>
          </div>
          <div className="text-2xl font-bold text-brand-900">
            {formatCurrency(profile.salaryStructure.netSalary)}
            <span className="text-xs font-normal text-brand-700 ml-1">/ month</span>
          </div>
        </div>
      </div>

      {/* Employee Documents */}
      <div className="p-6 rounded-2xl border border-surface-200/90 bg-white shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-surface-900">Employee Documents</h3>
          </div>
          <Badge variant="neutral" size="sm">
            {isAdminEdit ? 'Admin-managed' : 'HR-verified'}
          </Badge>
        </div>

        {documents.length === 0 && !isEditingNow && (
          <p className="text-xs text-surface-500 py-2">
            No documents on file yet.
            {isAdminEdit && ' Use “Add Document” after clicking Edit Profile.'}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(isEditingNow ? documents : profile.documents).map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-xl border border-surface-200 bg-surface-50/50 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-surface-800 truncate">{doc.name}</div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Open document <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {isEditingNow && isAdminEdit && (
                <button
                  type="button"
                  title="Remove document"
                  aria-label={`Remove ${doc.name}`}
                  onClick={() =>
                    setDocuments((docs) => docs.filter((d) => d.id !== doc.id))
                  }
                  className="p-1.5 rounded-md text-surface-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isEditingNow && isAdminEdit && (
          <div className="pt-2 border-t border-surface-100 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={docForm.name}
                onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Document name (e.g. PAN Card)"
              />
              <Input
                value={docForm.url}
                onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://drive.google.com/…"
                type="url"
              />
            </div>
            {docError && (
              <p className="text-xs font-medium text-rose-600">{docError}</p>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddDocument}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Locked field: shown to employees for HR-managed data. */
function ManagedField({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-surface-900 font-medium">
      {icon}
      <span>{children}</span>
      <Lock className="w-3 h-3 text-surface-300 ml-0.5" aria-hidden="true" />
    </div>
  );
}

/** Field the current viewer may legitimately edit (phone/address). */
function EditableValue({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5 text-surface-900 font-medium">
      {icon}
      <span>{children}</span>
    </div>
  );
}
