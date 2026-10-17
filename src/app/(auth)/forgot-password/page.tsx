import { AuthCard } from '@/components/auth/auth-card';
import { ForgotPasswordForm } from '@/components/auth/auth-forms';

export const metadata = { title: 'Reset your password' };
export default function ForgotPage() {
  return <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link."><ForgotPasswordForm /></AuthCard>;
}
