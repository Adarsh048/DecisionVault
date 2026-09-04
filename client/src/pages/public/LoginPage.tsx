import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    role: 'Admin / Owner',
    email: 'admin@decisionvault.io',
    password: 'Password123!',
    badge: 'Full Access',
    color: 'bg-[#FEF7EE] text-[#9A5B13] border-[#F8DCBA]',
  },
  {
    role: 'Engineer (Member)',
    email: 'alex@decisionvault.io',
    password: 'Password123!',
    badge: 'Create & Edit',
    color: 'bg-[#EBF5EE] text-[#275B3D] border-[#C6E4D1]',
  },
  {
    role: 'Stakeholder (Viewer)',
    email: 'viewer@decisionvault.io',
    password: 'Password123!',
    badge: 'Read-Only',
    color: 'bg-[#F4F4F0] text-[#6B6B66] border-[#E8E8E3]',
  },
];

export function LoginPage() {
  const { login, getErrorMessage } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      await login(data);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setServerError('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 shadow-subtle">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
            Sign in to DecisionVault
          </h1>
          <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
            Enter your email and password to access your team workspace.
          </p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-[#F8D7DA] dark:border-[#532626] bg-[#FDF2F2] dark:bg-[#2F1D1D] p-3 text-xs text-[#9B2C2C] dark:text-[#F08C8C]">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="login-email">
              Work Email
            </label>
            <input
              id="login-email"
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
            <div className="flex items-center justify-between">
              <label className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF]" htmlFor="login-password">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-[#6B6B66] hover:text-[#1C1C1A] dark:text-[#9E9EA8] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] text-xs font-semibold text-white shadow-subtle transition-colors disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-[#365B4B] dark:text-[#78C295] hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>

      {/* Demo Credentials Quick-Fill Card */}
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#969690]">
          Demo Access Credentials (Click to load)
        </div>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleFillDemo(acc.email, acc.password)}
              className="flex items-center justify-between rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-2.5 text-left text-xs transition-colors hover:bg-[#F5F5F2] group"
            >
              <div>
                <p className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF] group-hover:text-[#365B4B] dark:group-hover:text-[#78C295]">
                  {acc.role}
                </p>
                <p className="text-[11px] text-[#969690] font-mono">{acc.email}</p>
              </div>
              <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${acc.color}`}>
                {acc.badge}
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-[11px] text-[#969690]">
          Default demo password:{' '}
          <code className="rounded bg-[#F5F5F2] dark:bg-[#20222B] px-1.5 py-0.5 font-mono text-[#1C1C1A] dark:text-[#E8EAEF] border border-[#E8E8E3] dark:border-[#2B2E36]">
            Password123!
          </code>
        </p>
      </div>
    </div>
  );
}
