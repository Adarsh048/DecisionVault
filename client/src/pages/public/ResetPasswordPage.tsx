import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/authService';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/\d/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setServerError('');
    try {
      await authService.resetPassword({ token, password: data.password });
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setServerError(axiosError.response?.data?.message || 'An error occurred');
    }
  };

  if (!token) {
    return (
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle text-center space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
          Invalid reset link
        </h1>
        <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/forgot-password"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-5 text-xs font-semibold text-white transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle text-center space-y-4">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#275B3D] dark:text-[#78C295]" />
        <h1 className="text-xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
          Password reset
        </h1>
        <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-5 text-xs font-semibold text-white shadow-subtle transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
          Reset password
        </h1>
        <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          Enter your new password below to secure your account.
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-[#F8D7DA] dark:border-[#532626] bg-[#FDF2F2] dark:bg-[#2F1D1D] p-3 text-xs text-[#9B2C2C] dark:text-[#F08C8C]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="reset-password">
            New Password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`h-9 w-full rounded-lg border bg-[#FAFAF8] dark:bg-[#1D2026] px-3 pr-10 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none transition-colors ${
                errors.password ? 'border-[#C53030]' : 'border-[#E8E8E3] dark:border-[#2B2E36]'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969690] hover:text-[#1C1C1A]"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-[#C53030]">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="reset-confirm">
            Confirm Password
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`h-9 w-full rounded-lg border bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none transition-colors ${
              errors.confirmPassword ? 'border-[#C53030]' : 'border-[#E8E8E3] dark:border-[#2B2E36]'
            }`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-[11px] text-[#C53030]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] text-xs font-semibold text-white shadow-subtle transition-colors disabled:opacity-50 mt-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              <span>Resetting password...</span>
            </>
          ) : (
            <span>Reset password</span>
          )}
        </button>
      </form>
    </div>
  );
}
