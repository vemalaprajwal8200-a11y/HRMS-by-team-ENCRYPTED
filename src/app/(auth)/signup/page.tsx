import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up — Dayflow HRMS',
  description: 'Create your Dayflow HRMS employee or admin account',
};

export default function SignupPage() {
  return <SignupForm />;
}
