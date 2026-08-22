'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Check, IndianRupee } from 'lucide-react';
import { FormattedProfile } from '@/types/profile';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface AdminEditEmployeeModalProps {
  employee: FormattedProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: any) => Promise<{ error: any; data?: any }>;
}

export function AdminEditEmployeeModal({
  employee,
  isOpen,
  onClose,
  onSave,
}: AdminEditEmployeeModalProps) {
  const [form, setForm] = useState({
    fullName: employee?.fullName || '',
    role: (employee?.role || 'employee') as 'employee' | 'admin',
    designation: employee?.designation || '',
    department: employee?.department || '',
    employmentType: employee?.employmentType || 'Full-time',
    baseSalary: employee?.salaryStructure.baseSalary || 75000,
    allowances: employee?.salaryStructure.allowances || 25000,
    deductions: employee?.salaryStructure.deductions || 10000,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when employee changes
  React.useEffect(() => {
    if (employee) {
      setForm({
        fullName: employee.fullName,
        role: employee.role,
        designation: employee.designation,
        department: employee.department,
        employmentType: employee.employmentType,
        baseSalary: employee.salaryStructure.baseSalary,
        allowances: employee.salaryStructure.allowances,
        deductions: employee.salaryStructure.deductions,
      });
      setSuccessMsg(null);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    const res = await onSave(employee.id, {
      fullName: form.fullName,
      role: form.role,
      designation: form.designation,
      department: form.department,
      employmentType: form.employmentType,
      baseSalary: Number(form.baseSalary),
      allowances: Number(form.allowances),
      deductions: Number(form.deductions),
    });

    setIsSaving(false);
    if (!res.error) {
      setSuccessMsg('Employee details updated successfully in database!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-surface-200 w-full max-w-lg overflow-hidden"
        >
          <div className="p-5 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-surface-900">
                Edit Employee Profile
              </h3>
              <p className="text-xs text-surface-500">
                Modify role, compensation, and team details for {employee.fullName} ({employee.employeeId})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <Select
                label="System Access Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'employee' | 'admin' })}
                options={[
                  { label: 'Employee', value: 'employee' },
                  { label: 'HR Administrator', value: 'admin' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Designation"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                required
              />
              <Input
                label="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>

            <div className="p-3.5 bg-surface-50 rounded-xl border border-surface-200/80 space-y-3">
              <div className="font-semibold text-surface-900 text-xs flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-brand-600" />
                Monthly Compensation Breakdown (₹ INR)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Base Salary"
                  type="number"
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Allowances"
                  type="number"
                  value={form.allowances}
                  onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Deductions"
                  type="number"
                  value={form.deductions}
                  onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-surface-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
