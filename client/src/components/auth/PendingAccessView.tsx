import { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  Lock,
  Building2,
  Mail,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { useOrganizationStore } from '@/store/organizationStore';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { organizationService } from '@/services/organizationService';
import { Logo } from '@/components/ui/Logo';

export function PendingAccessView() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUIStore();
  const activeOrg = useOrganizationStore((state) => state.activeOrganization);

  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [approvedTransition, setApprovedTransition] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Check for admin approval from server roster
  const checkStatus = async (showFeedback = true) => {
    try {
      setIsChecking(true);
      if (showFeedback) setCheckMessage(null);

      const rosterData = await organizationService.getRoster();
      await useUserApprovalStore.getState().fetchFromApi();

      if (rosterData?.members && user) {
        const myEntry = rosterData.members.find(
          (m) => m.userId === user._id || (user.email && m.email?.toLowerCase() === user.email.toLowerCase())
        );

        if (myEntry && myEntry.status === 'active') {
          setApprovedTransition(true);
          setCheckMessage(`Approval confirmed! Granted ${myEntry.role} access.`);
          useUserApprovalStore.getState().openWelcomeDialog({
            id: user._id,
            name: user.name || 'Teammate',
            email: user.email,
            role: myEntry.role,
            team: myEntry.team || 'Platform Engineering',
            reviewedBy: 'Sarah Chen (Owner)',
            approvedAt: new Date().toISOString(),
            welcomed: false,
          });
          setTimeout(() => {
            window.location.reload();
          }, 800);
          return;
        }
      }

      if (showFeedback) {
        setCheckMessage('Status verified: Your account is still awaiting administrator review.');
      }
    } catch (err) {
      if (showFeedback) {
        setCheckMessage('Could not reach server. Will recheck automatically.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Automatically poll every 8 seconds so approval is detected without user clicking
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [user?._id, user?.email]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#111216] text-[#1C1C1A] dark:text-[#E8EAEF]">
      {/* ─── Top Restricted Header ────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" href="#" />
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#9A5B13] dark:text-[#F3B367] bg-[#FEF7EE] dark:bg-[#2A2318] px-2 py-0.5 rounded border border-[#F8DCBA] dark:border-[#5C4524]">
            <Lock className="h-3 w-3" />
            <span>Workspace Restricted</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            className="p-1.5 rounded-lg text-[#969690] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs text-[#969690] hover:text-[#C53030] p-1.5 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ─── Main Holding View ────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-xl w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Main Card */}
          <div className="rounded-2xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 sm:p-8 shadow-elevation text-center">
            {/* Pulsing Status Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF7EE] dark:bg-[#2A2115] border border-[#F8DCBA] dark:border-[#523F21] text-[#9A5B13] dark:text-[#F3B367] shadow-subtle mb-5">
              {approvedTransition ? (
                <CheckCircle2 className="h-8 w-8 text-[#275B3D] dark:text-[#78C295] animate-bounce" />
              ) : (
                <Clock className="h-8 w-8 animate-pulse" />
              )}
            </div>

            {/* Status Tag */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7EE] dark:bg-[#2A2318] px-3 py-1 text-xs font-semibold text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-ping" />
              <span>Under Review · Waiting for Role-Based Access</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
              Account Under Review
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B66] dark:text-[#9E9EA8] mt-2 max-w-md mx-auto leading-relaxed">
              Welcome to DecisionVault. For security governance, all workspace decisions, architecture records, teams, and activity feeds are locked until an administrator assigns your role.
            </p>

            {/* Account Metadata Summary Box */}
            <div className="mt-6 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1C1F26] p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E3] dark:border-[#2B2E36]">
                <span className="text-[#969690] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Applicant Name</span>
                </span>
                <span className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {user?.name || 'Registered Engineer'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E3] dark:border-[#2B2E36]">
                <span className="text-[#969690] flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Registered Email</span>
                </span>
                <span className="font-mono text-[11px] text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {user?.email}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E3] dark:border-[#2B2E36]">
                <span className="text-[#969690] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Workspace Organization</span>
                </span>
                <span className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {activeOrg?.name || 'DecisionVault Global'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#969690] flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Access Level</span>
                </span>
                <span className="font-semibold text-[#9A5B13] dark:text-[#F3B367]">
                  Restricted (Zero Details Visible)
                </span>
              </div>
            </div>

            {/* Notification alert / Check status message */}
            {checkMessage && (
              <div className="mt-4 p-3 rounded-lg bg-[#FEF7EE] dark:bg-[#2A2318] border border-[#F8DCBA] dark:border-[#5C4524] text-xs text-[#9A5B13] dark:text-[#F3B367]">
                {checkMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => checkStatus(true)}
                disabled={isChecking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-5 py-2.5 text-xs font-semibold text-white shadow-subtle transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking Approval...' : 'Check Access Status'}</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-4 py-2.5 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
              >
                <span>Sign in with different account</span>
              </button>
            </div>

            <p className="text-[11px] text-[#969690] mt-4 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#365B4B] animate-pulse" />
              <span>Background sync active · This screen will unlock automatically once approved</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
