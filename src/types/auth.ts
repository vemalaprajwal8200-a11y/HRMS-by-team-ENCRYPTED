import { UserRole } from './database';

export interface SignupFormData {
  employeeId: string;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface SignupFormErrors {
  employeeId?: string;
  companyName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

export interface SigninFormData {
  email: string;
  password: string;
}

export interface SigninFormErrors {
  email?: string;
  password?: string;
  general?: string;
  unverifiedEmail?: string;
}

export interface AuthState {
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
  } | null;
  role: UserRole | null;
  employeeId: string | null;
  fullName: string | null;
  isLoading: boolean;
  isEmailVerified: boolean;
}
