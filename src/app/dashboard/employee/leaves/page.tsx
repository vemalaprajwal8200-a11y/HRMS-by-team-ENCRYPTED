'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LeavesStubPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-subtle">
        <CalendarDays className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <Badge variant="warning" size="md">
          Phase 4 Module Stub
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900">
          Leave Management & Approvals
        </h1>
        <p className="text-sm text-surface-600 max-w-md mx-auto">
          Time-off applications, multi-tier approval workflows, and leave quotas will be implemented in Phase 4. Database tables are already ready.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-surface-200/90 shadow-card text-left text-xs space-y-2 max-w-md mx-auto">
        <div className="font-semibold text-surface-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" />
          Planned Features in Phase 4:
        </div>
        <ul className="list-disc list-inside text-surface-500 space-y-1 text-[11px]">
          <li>Casual, sick, earned, and maternity/paternity leave requests</li>
          <li>Real-time admin approval / rejection interface with comments</li>
          <li>Leave ledger & balance counters</li>
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
