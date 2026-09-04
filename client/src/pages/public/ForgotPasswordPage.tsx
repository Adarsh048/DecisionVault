import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/authService';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setServerError('');
    try {
      await authService.forgotPassword(data);
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setServerError(axiosError.response?.data?.message || 'An error occurred');
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle text-center space-y-4">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#275B3D] dark:text-[#78C295]" />
        <h1 className="text-xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
          Check your email
        </h1>
        <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] max-w-xs mx-auto">
          If an account with that email exists, we've sent password reset instructions.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-5 text-xs font-semibold text-white shadow-subtle transition-colors"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
          Forgot password
        </h1>
        <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          Enter your registered work email to receive a secure reset link.
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-[#F8D7DA] dark:border-[#532626] bg-[#FDF2F2] dark:bg-[#2F1D1D] p-3 text-xs text-[#9B2C2C] dark:text-[#F08C8C]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="forgot-email">
            Work Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={`h-9 w-full rounded-lg border bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none transition-colors ${
              errors.email ? 'border-[#C53030]' : 'border-[#E8E8E3] dark:border-[#2B2E36]'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[11px] text-[#C53030]">{errors.email.message}</p>
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
              <span>Sending reset link...</span>
            </>
          ) : (
            <span>Send reset link</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to login</span>
        </Link>
      </div>
    </div>
  );
}
