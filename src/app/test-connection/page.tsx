import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function TestConnectionPage() {
  let isConnected = false;
  let errorMsg = '';
  let sessionStatus = 'No active session (expected for guest)';

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      errorMsg = error.message;
    } else {
      isConnected = true;
      if (data.session) {
        sessionStatus = `Active session for: ${data.session.user.email}`;
      }
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Failed to initialize Supabase client';
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-surface-200 p-8 shadow-card space-y-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {isConnected ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">Supabase Connection Test</h1>
            <p className="text-xs text-surface-500">Server Component Connection Verification</p>
          </div>
        </div>

        <div className="space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-100 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-surface-200/60">
            <span className="text-surface-500 font-medium">Server Client:</span>
            <span className={isConnected ? 'text-emerald-700 font-semibold flex items-center gap-1' : 'text-rose-700 font-semibold'}>
              {isConnected ? <><ShieldCheck className="w-3.5 h-3.5" /> Initialized Successfully</> : 'Failed to Initialize'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-surface-200/60">
            <span className="text-surface-500 font-medium">Auth Session Call:</span>
            <span className="text-surface-800 font-medium">{sessionStatus}</span>
          </div>

          {errorMsg && (
            <div className="pt-2 text-rose-600 font-mono text-[11px] break-all">
              Error: {errorMsg}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link href="/" className="block">
            <Button variant="primary" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
