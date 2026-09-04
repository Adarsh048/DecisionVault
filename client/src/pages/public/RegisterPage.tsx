import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserApprovalStore } from '@/store/userApprovalStore';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/\d/, 'Must contain a number'),
});

type RegisterForm = z.infer<typeof registerSchema>;

function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'A number', met: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req) => (
        <div key={req.label} className="flex items-center gap-1.5 text-[11px]">
          {req.met ? (
            <Check className="h-3 w-3 text-[#275B3D] dark:text-[#78C295]" />
          ) : (
            <X className="h-3 w-3 text-[#969690]" />
          )}
          <span className={req.met ? 'text-[#275B3D] dark:text-[#78C295]' : 'text-[#969690]'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RegisterPage() {
  const { register: registerUser, getErrorMessage } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      useUserApprovalStore.getState().addPendingUser(data.name, data.email);
      await registerUser(data);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
          Create an account
        </h1>
        <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          Join Acme Corporation on DecisionVault to collaborate on architecture decisions.
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-[#F8D7DA] dark:border-[#532626] bg-[#FDF2F2] dark:bg-[#2F1D1D] p-3 text-xs text-[#9B2C2C] dark:text-[#F08C8C]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="register-name">
            Full Name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Sarah Chen"
            className={`h-9 w-full rounded-lg border bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none transition-colors ${
              errors.name ? 'border-[#C53030]' : 'border-[#E8E8E3] dark:border-[#2B2E36]'
            }`}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-[11px] text-[#C53030]">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="register-email">
            Work Email
          </label>
          <input
            id="register-email"
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

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="register-password">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
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
          <PasswordRequirements password={watchPassword} />
          {errors.password && (
            <p className="text-[11px] text-[#C53030]">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] text-xs font-semibold text-white shadow-subtle transition-colors disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-[#365B4B] dark:text-[#78C295] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
