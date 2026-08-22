import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const verificationType = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard/employee';
  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Determine if user is admin or employee
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const userRole = (profile as { role?: string } | null)?.role;
        const destination = userRole === 'admin' ? '/dashboard/admin' : '/dashboard/employee';
        return NextResponse.redirect(`${origin}${destination}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Supabase confirmation templates may send token_hash instead of an auth code.
  if (tokenHash && verificationType === 'email') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
    if (!error) {
      return NextResponse.redirect(`${origin}/signin?verified=1`);
    }
  }

  // Return the user to an error page or signin with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`);
}
