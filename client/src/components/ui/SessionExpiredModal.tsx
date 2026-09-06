import { useEffect } from 'react';
import { Clock, LogIn, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function SessionExpiredModal() {
  const { isSessionExpired, user, setSessionExpired, logout } = useAuthStore();

  useEffect(() => {
    // Prevent background scrolling while the session expired modal is open
    if (isSessionExpired) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSessionExpired]);

  if (!isSessionExpired) {
    return null;
  }

  const handleLoginAgain = () => {
    const currentPath = window.location.pathname;
    setSessionExpired(false);
    logout();
    const returnUrl =
      currentPath && currentPath.startsWith('/app')
        ? `?returnUrl=${encodeURIComponent(currentPath)}`
        : '';
    window.location.href = `/login${returnUrl}`;
  };

  const handleGoHome = () => {
    setSessionExpired(false);
    logout();
    window.location.href = '/';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 sm:p-6 shadow-elevation space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF7EE] dark:bg-[#2A2318] text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="session-expired-title"
                className="text-lg font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]"
              >
                Your session is over
              </h2>
              <span className="rounded bg-[#FEF7EE] dark:bg-[#2A2318] px-1.5 py-0.5 text-[10px] font-bold text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
                Expired
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
              Your security session has timed out due to token expiration or inactivity. To protect your workspace records and decision integrity, please sign in again.
            </p>
          </div>
        </div>

        {/* User Context Box */}
        {user && (
          <div className="flex items-center gap-3 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-3 text-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-[#969690] font-mono truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F2] dark:bg-[#1D2026] p-2.5 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
          <ShieldAlert className="h-4 w-4 text-[#969690] shrink-0" />
          <span>Offline drafts and local-first records remain safely preserved.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
          <button
            type="button"
            onClick={handleGoHome}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-3.5 py-2 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
          >
            Go to Home
          </button>
          <button
            type="button"
            autoFocus
            onClick={handleLoginAgain}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In Again</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
