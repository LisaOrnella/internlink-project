import { AuthCard } from '@/components/auth/auth-card';
import { ResetPasswordForm } from '@/components/auth/auth-forms';

export const metadata = { title: 'Choose a new password' };
export default function ResetPage() {
  return <AuthCard title="Choose a new password" subtitle="Pick something strong that you don't use elsewhere."><ResetPasswordForm /></AuthCard>;
}
