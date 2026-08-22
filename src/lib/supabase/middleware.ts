import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured yet with real credentials, let users navigate pages
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    return response;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/signin') || path.startsWith('/signup') || path.startsWith('/verify-email');
  const isDashboard = path.startsWith('/dashboard') || path.startsWith('/employee') || path.startsWith('/admin');
  const isAdminDashboard = path.startsWith('/dashboard/admin') || path.startsWith('/admin');
  const isSecurityRoute = path.includes('/profile');

  // 1. Unauthenticated users trying to access protected dashboard routes
  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirectedFrom', path);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user logic
  if (user) {
    const { data: account } = await supabase.from('users').select('must_change_password').eq('id', user.id).maybeSingle();
    if ((account as { must_change_password?: boolean } | null)?.must_change_password && !isSecurityRoute && !isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/employee/profile';
      url.searchParams.set('tab', 'security');
      return NextResponse.redirect(url);
    }
    // If authenticated user tries to visit auth pages (/signin or /signup)
    if (isAuthPage && !path.startsWith('/verify-email')) {
      // Fetch role to redirect to right dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole =
        (profile as { role?: string } | null)?.role ||
        (user.user_metadata?.role as string | undefined) ||
        'employee';
      const targetPath = userRole === 'admin' ? '/dashboard/admin' : '/dashboard/employee';
      return NextResponse.redirect(new URL(targetPath, request.url));
    }

    // Role-based protection: Employee accessing /dashboard/admin/*
    if (isAdminDashboard) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole =
        (profile as { role?: string } | null)?.role ||
        (user.user_metadata?.role as string | undefined) ||
        'employee';

      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/employee', request.url));
      }
    }
  }

  return response;
}
