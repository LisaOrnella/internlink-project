'use client';
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { GraduationCap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { loginSchema, newPasswordSchema, registerSchema, resetRequestSchema } from '@/lib/validators';
import { loginAction, registerAction, requestResetAction, updatePasswordAction } from '@/actions/auth';
import { cn } from '@/lib/utils';
import type { ActionResult } from '@/types/db';
import type { z } from 'zod';

function useSubmit() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  function run(fn: () => Promise<ActionResult>, setServerErrors?: (e: Record<string, string>) => void) {
    setFormError(null);
    start(async () => {
      const res = await fn();
      if (res.errors && setServerErrors) setServerErrors(res.errors);
      if (!res.ok) { setFormError(res.message ?? 'Something went wrong.'); toast.error(res.message ?? 'Please check the form.'); return; }
      if (res.message) toast.success(res.message);
      if (res.redirect) { router.push(res.redirect); router.refresh(); }
    });
  }
  return { pending, formError, run };
}

const FormError = ({ msg }: { msg: string | null }) =>
  msg ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</div> : null;

export function LoginForm() {
  const sp = useSearchParams();
  const { pending, formError, run } = useSubmit();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  return (
    <form onSubmit={handleSubmit((v) => run(() => loginAction(v, sp.get('next') ?? undefined)))} className="space-y-4" noValidate>
      {sp.get('registered') && <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">Account created. Confirm your email (if required), then log in.</div>}
      {sp.get('reset') && <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">Password updated. You can log in now.</div>}
      <FormError msg={formError} />
      <Field id="email" label="Email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field id="password" label="Password" error={errors.password?.message} required>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
      </Field>
      <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-teal-700 hover:underline">Forgot password?</Link></div>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? 'Signing in…' : 'Log in'}</Button>
      <p className="text-center text-sm text-slate-600">New here? <Link href="/register" className="font-semibold text-teal-700 hover:underline">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const sp = useSearchParams();
  const { pending, formError, run } = useSubmit();
  const initialRole = sp.get('role') === 'company' ? 'company' : 'student';
  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema), defaultValues: { role: initialRole },
  });
  const role = watch('role');
  const roles = [
    { v: 'student' as const, label: "I'm a student", sub: 'Find and apply for internships', icon: GraduationCap },
    { v: 'company' as const, label: "I'm hiring", sub: 'Post internships, manage applicants', icon: Building2 },
  ];
  return (
    <form onSubmit={handleSubmit((v) => run(() => registerAction(v), (errs) => Object.entries(errs).forEach(([k, m]) => setError(k as keyof z.infer<typeof registerSchema>, { message: m }))))} className="space-y-4" noValidate>
      <FormError msg={formError} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-navy-800">I am joining as</legend>
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ v, label, sub, icon: Icon }) => (
            <label key={v} className={cn('cursor-pointer rounded-2xl border-2 p-3.5 transition focus-within:ring-2 focus-within:ring-teal-300', role === v ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300')}>
              <input type="radio" value={v} className="sr-only" checked={role === v} onChange={() => setValue('role', v)} />
              <Icon size={22} className={role === v ? 'text-teal-600' : 'text-slate-400'} />
              <span className="mt-1.5 block text-sm font-semibold text-navy-900">{label}</span>
              <span className="block text-xs text-slate-500">{sub}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="fullName" label={role === 'company' ? 'Your full name' : 'Full name'} error={errors.fullName?.message} required>
        <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register('fullName')} />
      </Field>
      {role === 'company' && (
        <Field id="companyName" label="Company name" error={errors.companyName?.message} required>
          <Input id="companyName" autoComplete="organization" aria-invalid={!!errors.companyName} {...register('companyName')} />
        </Field>
      )}
      <Field id="email" label="Email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="password" label="Password" hint="8+ characters, with a letter and a number" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
        </Field>
        <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
        </Field>
      </div>
      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</Button>
      <p className="text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-teal-700 hover:underline">Log in</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { pending, formError, run } = useSubmit();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof resetRequestSchema>>({ resolver: zodResolver(resetRequestSchema) });
  if (sent) return <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900">If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).</div>;
  return (
    <form onSubmit={handleSubmit((v) => run(async () => { const r = await requestResetAction(v); if (r.ok) setSent(true); return { ...r, message: undefined }; }))} className="space-y-4" noValidate>
      <FormError msg={formError} />
      <Field id="email" label="Email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const { pending, formError, run } = useSubmit();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof newPasswordSchema>>({ resolver: zodResolver(newPasswordSchema) });
  return (
    <form onSubmit={handleSubmit((v) => run(() => updatePasswordAction(v)))} className="space-y-4" noValidate>
      <FormError msg={formError} />
      <Field id="password" label="New password" error={errors.password?.message} required>
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message} required>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? 'Saving…' : 'Update password'}</Button>
    </form>
  );
}
