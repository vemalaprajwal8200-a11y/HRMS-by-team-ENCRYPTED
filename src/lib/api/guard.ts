import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

type ServerSupabase = ReturnType<typeof createClient>;

export interface AuthContext {
  supabase: ServerSupabase;
  user: User;
  role: UserRole;
}

/**
 * Resolve the current Phase 1 session from request cookies and look up the
 * caller's role from public.profiles — the exact same mechanism the existing
 * edge middleware (src/lib/supabase/middleware.ts) and the is_admin() RLS
 * helper use. No new auth logic; API routes simply reuse it directly because
 * Next.js middleware does not intercept /api/* here.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile as { role?: UserRole } | null)?.role;

  // Role falls back to signup metadata only if the trigger-created row has
  // not landed yet (same fallback the AuthContext uses).
  if (!role) {
    const metaRole = user.user_metadata?.role as UserRole | undefined;
    if (!metaRole) return null;
    return { supabase, user, role: metaRole };
  }

  return { supabase, user, role };
}

export function unauthorized() {
  return NextResponse.json(
    { error: 'Authentication required. Please sign in.' },
    { status: 401 }
  );
}

export function forbidden(
  message = 'You do not have permission to perform this action.'
) {
  return NextResponse.json({ error: message }, { status: 403 });
}
