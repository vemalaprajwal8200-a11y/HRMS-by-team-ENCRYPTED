// TEMPORARY DEBUG PAGE — DELETE AFTER VERIFYING SUPABASE CONNECTION
// This file should NOT be committed or shipped to production permanently.
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DebugEnvPage() {
  let status: 'SUCCESS' | 'FAILED' = 'FAILED';
  let errorMessage: string | null = null;

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      status = 'FAILED';
      errorMessage = error.message;
    } else {
      status = 'SUCCESS';
    }
  } catch (err: unknown) {
    status = 'FAILED';
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Supabase Connection Debug</h1>

      <div
        style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: status === 'SUCCESS' ? '#d1fae5' : '#fee2e2',
          border: `2px solid ${status === 'SUCCESS' ? '#10b981' : '#ef4444'}`,
        }}
      >
        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
          Supabase connection:{' '}
          <span style={{ color: status === 'SUCCESS' ? '#065f46' : '#991b1b' }}>
            {status}
          </span>
        </p>

        {errorMessage && (
          <p style={{ marginTop: '0.75rem', color: '#7f1d1d', wordBreak: 'break-all' }}>
            Error: {errorMessage}
          </p>
        )}
      </div>

      <p style={{ marginTop: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
        This page is temporary. Delete /src/app/debug-env once you have confirmed
        SUCCESS in both local and production environments.
      </p>
    </main>
  );
}
