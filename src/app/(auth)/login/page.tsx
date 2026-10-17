import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/auth-forms';

export const metadata = { title: 'Log in' };
export default function LoginPage() {
  return <AuthCard title="Welcome back" subtitle="Log in to continue to InternLink."><Suspense><LoginForm /></Suspense></AuthCard>;
}
