'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarCheck, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AttendanceStubPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-subtle">
        <CalendarCheck className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <Badge variant="primary" size="md">
          Phase 3 Module Stub
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900">
          Attendance & Time Tracking
        </h1>
        <p className="text-sm text-surface-600 max-w-md mx-auto">
          Daily clock-in/out, biometric sync, and work-hour analytics will be enabled in Phase 3. Database schema & types are already provisioned.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-surface-200/90 shadow-card text-left text-xs space-y-2 max-w-md mx-auto">
        <div className="font-semibold text-surface-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-600" />
          Planned Features in Phase 3:
        </div>
        <ul className="list-disc list-inside text-surface-500 space-y-1 text-[11px]">
          <li>One-tap check in / check out with timestamp logging</li>
          <li>Monthly working hours & overtime calculation</li>
          <li>Attendance percentage KPI calculations</li>
        </ul>
      </div>

      <div>
        <Link href="/dashboard/employee">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
