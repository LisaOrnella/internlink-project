import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/auth-forms';

export const metadata = { title: 'Create your account' };
export default function RegisterPage() {
  return <AuthCard title="Create your account" subtitle="Join as a student or as a company — it takes a minute."><Suspense><RegisterForm /></Suspense></AuthCard>;
}
