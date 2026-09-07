import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/ui/Logo';
import { prewarmServer } from '@/services/api';

export function AuthLayout() {
  useEffect(() => {
    prewarmServer();
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF8] dark:bg-[#111216] px-4 py-12">
      {/* Clean Architectural Logo */}
      <div className="mb-8 flex items-center justify-center">
        <Logo size="lg" showSubtitle href="/" />
      </div>

      {/* Content Container */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>

      {/* Minimal Footer */}
      <p className="mt-8 text-center text-xs text-[#969690]">
        © {new Date().getFullYear()} {APP_NAME} · Decision Architecture & Governance Platform
      </p>
    </div>
  );
}
