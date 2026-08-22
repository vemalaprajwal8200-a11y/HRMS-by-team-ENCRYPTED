'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { FormattedProfile, formatProfileRow } from '@/types/profile';
import { UserRole } from '@/types/database';
import { SignupFormData, SigninFormData } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: FormattedProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (data: SignupFormData) => Promise<{ error: Error | null; unconfirmedUser?: boolean }>;
  signIn: (data: SigninFormData) => Promise<{ error: Error | null; unverifiedEmail?: boolean; role?: UserRole }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null; success: boolean }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy mock profile when in unconfigured/demo preview mode
const MOCK_PROFILE: FormattedProfile = {
  id: 'mock-user-123',
  employeeId: 'EMP-1001',
  fullName: 'Alex Vance',
  email: 'alex.vance@dayflow.internal',
  role: 'employee',
  phone: '+91 98765 43210',
  address: 'Indiranagar 100ft Road, Bangalore, KA 560038',
  photoUrl: undefined,
  designation: 'Lead Frontend Engineer',
  department: 'Engineering',
  dateOfJoining: '2024-03-15',
  employmentType: 'Full-time',
  salaryStructure: {
    baseSalary: 110000,
    allowances: 35000,
    deductions: 18000,
    netSalary: 127000,
  },
  documents: [
    {
      id: 'doc-1',
      name: 'Employment Offer Letter.pdf',
      url: '#',
      uploadedAt: '2024-03-15T10:00:00Z',
      category: 'contract',
    },
    {
      id: 'doc-2',
      name: 'Aadhaar Card Copy.pdf',
      url: '#',
      uploadedAt: '2024-03-15T10:00:00Z',
      category: 'id_proof',
    },
  ],
  createdAt: '2024-03-15T10:00:00Z',
  updatedAt: '2024-03-15T10:00:00Z',
};

function getSignupError(error: AuthError, employeeId: string): Error {
  const message = error.message.toLowerCase();

  if (message.includes('user already registered') || message.includes('already been registered')) {
    return new Error('An account with this email already exists. Please sign in or use a different email address.');
  }

  if (message.includes('database error saving new user') || message.includes('duplicate key')) {
    return new Error(
      `This employee ID (${employeeId}) may already be registered. Please use a unique employee ID, or contact an administrator if the problem continues.`
    );
  }

  return error;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FormattedProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, fallbackRole?: UserRole) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch note (may be new user or RLS):', error.message);
        // Fallback minimal profile if row is pending trigger creation
        const fallback: FormattedProfile = {
          id: userId,
          employeeId: 'EMP-' + userId.substring(0, 5).toUpperCase(),
          fullName: userEmail ? userEmail.split('@')[0] : 'Employee',
          email: userEmail || '',
          role: fallbackRole || 'employee',
          phone: 'Not provided',
          address: 'Not provided',
          photoUrl: undefined,
          designation: fallbackRole === 'admin' ? 'HR Administrator' : 'Software Engineer',
          department: fallbackRole === 'admin' ? 'Human Resources' : 'Engineering',
          dateOfJoining: new Date().toISOString().split('T')[0],
          employmentType: 'Full-time',
          salaryStructure: {
            baseSalary: fallbackRole === 'admin' ? 95000 : 75000,
            allowances: fallbackRole === 'admin' ? 30000 : 25000,
            deductions: fallbackRole === 'admin' ? 15000 : 10000,
            netSalary: fallbackRole === 'admin' ? 110000 : 90000,
          },
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallback);
        setRole(fallback.role);
        return;
      }

      if (data) {
        const formatted = formatProfileRow(data);
        setProfile(formatted);
        setRole(formatted.role);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email, role || 'employee');
    }
  }, [user, role, fetchProfile]);

  useEffect(() => {
    if (!configured) {
      // Running in initial unconfigured mode: set safe defaults
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const metaRole = initialSession.user.user_metadata?.role as UserRole;
          await fetchProfile(initialSession.user.id, initialSession.user.email, metaRole);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const metaRole = currentUser.user_metadata?.role as UserRole;
        await fetchProfile(currentUser.id, currentUser.email, metaRole);
      } else {
        setProfile(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, supabase, fetchProfile]);

  const signUp = async (formData: SignupFormData) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            employee_id: formData.employeeId.trim().toUpperCase(),
            full_name: formData.fullName.trim(),
            role: formData.role,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      });

      if (error) {
        return { error: getSignupError(error, formData.employeeId.trim().toUpperCase()) };
      }

      // Check if email confirmation is required by Supabase
      const unconfirmedUser = !data.session && !data.user?.email_confirmed_at;

      return { error: null, unconfirmedUser };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Signup failed');
      return { error };
    }
  };

  const signIn = async (formData: SigninFormData) => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        // Check for unconfirmed email
        if (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('email not verified')
        ) {
          return { error, unverifiedEmail: true };
        }
        return { error };
      }

      if (data.user) {
        // Fetch user's profile to retrieve role
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const profileData = userProfile as { role?: UserRole } | null;
        const userRole = (profileData?.role || data.user.user_metadata?.role || 'employee') as UserRole;
        setRole(userRole);
        return { error: null, role: userRole };
      }

      return { error: new Error('No user returned from login.') };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Signin failed');
      return { error };
    }
  };

  const signOut = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const resendVerificationEmail = async (email: string) => {
    if (!configured) {
      return { error: new Error('Supabase not configured.'), success: false };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error, success: false };
      }
      return { error: null, success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to resend email');
      return { error, success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        isConfigured: configured,
        signUp,
        signIn,
        signOut,
        resendVerificationEmail,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
