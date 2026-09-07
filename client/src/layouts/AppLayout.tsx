import { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Search,
  Users,
  Settings,
  Activity,
  Plus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Building2,
  Lock,
  RefreshCw,
  WifiOff,
  Bell,
  Sparkles,
  CheckCheck,
  ArrowUpRight,
  ChevronsUpDown,
  Crown,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useSyncStore } from '@/store/syncStore';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { useOrganizationStore } from '@/store/organizationStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useDecisionStore } from '@/store/decisionStore';
import { organizationService } from '@/services/organizationService';
import { syncEngine } from '@/services/syncEngine';
import { socketService } from '@/services/socketService';
import { Logo } from '@/components/ui/Logo';
import { PendingAccessView } from '@/components/auth/PendingAccessView';
import { NewDecisionProposalModal } from '@/components/ui/NewDecisionProposalModal';
import { RoleWelcomeModal } from '@/components/ui/RoleWelcomeModal';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  shortcut?: string;
  badge?: number;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUIStore();
  const permissions = usePermissions();
  const sync = useSyncStore();
  const activeOrg = useOrganizationStore((state) => state.activeOrganization);
  const approvals = useUserApprovalStore((state) => state.approvals);
  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  useEffect(() => {
    syncEngine.init();
    useUserApprovalStore.getState().fetchFromApi();
    organizationService.getRoster().then((data) => {
      if (data?.organization) {
        useOrganizationStore.getState().setActiveOrganization({
          _id: data.organization.id,
          name: data.organization.name,
          slug: data.organization.slug,
          owner: data.organization.owner,
          members: (data.members || []).map((m) => ({
            userId: m.userId,
            role: m.role,
            status: m.status,
            joinedAt: m.joinedAt || new Date().toISOString(),
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }).catch(() => {});
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close dropdown when clicking outside or pressing Escape key
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  // Auto-close menus when navigating to another part/page
  useEffect(() => {
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Auto-close menu on moving cursor away to other parts
  const handleUserMenuMouseEnter = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
      userMenuTimeoutRef.current = null;
    }
  };

  const handleUserMenuMouseLeave = () => {
    if (userMenuOpen) {
      userMenuTimeoutRef.current = setTimeout(() => {
        setUserMenuOpen(false);
      }, 350);
    }
  };

  useEffect(() => {
    return () => {
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current);
      }
    };
  }, []);

  const {
    notifications,
    activeToast,
    markAsRead,
    markAllAsRead,
    dismissToast,
    openProposalDialog,
  } = useNotificationStore();

  const decisions = useDecisionStore((state) => state.decisions);

  // Active decisions set for validation
  const activeDecisionIds = useMemo(() => new Set(decisions.map((d) => d.id)), [decisions]);

  // Clean, validated notifications: strictly exclude any old/deleted decisions
  const displayNotifications = useMemo(() => {
    const legacyIds = new Set(['dec-1', 'dec-2', 'dec-3', 'dec-4', 'dec-5']);
    return notifications.filter((n) => {
      if (n.id.includes('-sim-') || n.id.includes('init') || n.decisionId?.includes('-sim-')) return false;
      if (n.decisionId && legacyIds.has(n.decisionId)) return false;
      if (n.decisionId && !activeDecisionIds.has(n.decisionId)) return false;
      return true;
    });
  }, [notifications, activeDecisionIds]);

  const displayUnreadCount = useMemo(() => {
    return displayNotifications.filter((n) => !n.read).length;
  }, [displayNotifications]);

  // Self-cleaning effect: permanently purge stale decision notifications from the persisted store
  useEffect(() => {
    const legacyIds = new Set(['dec-1', 'dec-2', 'dec-3', 'dec-4', 'dec-5']);
    const hasStale = notifications.some((n) => {
      if (n.id.includes('-sim-') || n.id.includes('init') || n.decisionId?.includes('-sim-')) return true;
      if (n.decisionId && legacyIds.has(n.decisionId)) return true;
      if (n.decisionId && !activeDecisionIds.has(n.decisionId)) return true;
      return false;
    });

    if (hasStale) {
      const cleaned = notifications.filter((n) => {
        if (n.id.includes('-sim-') || n.id.includes('init') || n.decisionId?.includes('-sim-')) return false;
        if (n.decisionId && legacyIds.has(n.decisionId)) return false;
        if (n.decisionId && !activeDecisionIds.has(n.decisionId)) return false;
        return true;
      });
      useNotificationStore.setState({
        notifications: cleaned,
        unreadCount: cleaned.filter((n) => !n.read).length,
      });
    }
  }, [activeDecisionIds, notifications]);

  // Check if current user was recently approved and should see the Role Welcome dialogue box
  useEffect(() => {
    if (user?.email && !permissions.isPendingApproval) {
      useUserApprovalStore.getState().checkAndTriggerWelcome(user.email);
    }
  }, [user?.email, permissions.isPendingApproval]);

  // Initialize Socket.IO connection for real-time notifications
  useEffect(() => {
    socketService.init(activeOrg?.slug || 'acme-corp');
  }, [activeOrg?.slug]);

  // Auto-dismiss floating toast notification after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  const formatTimeAgo = (isoString?: string): string => {
    if (!isoString) return 'Recently';
    try {
      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
      if (diffSec < 45) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Global search shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/app/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const workspaceNavItems: NavItem[] = [
    { label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Decisions', href: '/app/decisions', icon: FileText },
    { label: 'Search', href: '/app/search', icon: Search, shortcut: '⌘K' },
    {
      label: 'Teams & Members',
      href: '/app/teams',
      icon: Users,
      badge: permissions.isAdmin && pendingCount > 0 ? pendingCount : undefined,
    },
  ];

  const managementNavItems: NavItem[] = [
    { label: 'Activity Log', href: '/app/activity', icon: Activity },
    { label: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  const renderSyncIndicator = () => {
    if (!sync.isOnline || sync.status === 'offline' || sync.isSimulatedOffline) {
      return (
        <button
          type="button"
          onClick={() => syncEngine.setSimulatedOffline(!sync.isSimulatedOffline)}
          className="flex items-center gap-1.5 text-xs text-[#9A5B13] dark:text-[#F3B367] px-2.5 py-1 rounded-md bg-[#FEF7EE] dark:bg-[#2A2318] border border-[#F8DCBA] dark:border-[#5C4524] hover:bg-[#FDF2E2] dark:hover:bg-[#382E1E] transition-colors"
          title={
            sync.isSimulatedOffline
              ? 'Simulated offline active. Click to go online.'
              : 'Working offline. Changes are saved locally in IndexedDB. Click to toggle.'
          }
        >
          <WifiOff className="h-3.5 w-3.5 text-[#D97706]" />
          <span className="hidden sm:inline">Offline · Local Vault</span>
          {sync.pendingCount > 0 && (
            <span className="rounded-full bg-[#F8DCBA] dark:bg-[#5C4524] px-1.5 text-[10px] font-mono font-bold">
              {sync.pendingCount}
            </span>
          )}
        </button>
      );
    }

    if (sync.status === 'syncing') {
      return (
        <div
          className="flex items-center gap-1.5 text-xs text-[#9A5B13] dark:text-[#F3B367] px-2.5 py-1 rounded-md bg-[#FEF7EE] dark:bg-[#2A2318] border border-[#F8DCBA] dark:border-[#4D391A]"
          title="Syncing local changes with server"
        >
          <RefreshCw className="h-3 w-3 animate-spin text-[#D97706]" />
          <span className="hidden sm:inline">
            Syncing{sync.pendingCount > 0 ? ` ${sync.pendingCount} changes` : ''}...
          </span>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => syncEngine.processOutbox()}
        className="flex items-center gap-1.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] px-2.5 py-1 rounded-md hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] border border-transparent hover:border-[#E8E8E3] dark:hover:border-[#2B2E36] transition-colors"
        title="All local changes saved in IndexedDB vault. Click to sync."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#365B4B]" />
        <span className="hidden sm:inline">Vault Synced</span>
      </button>
    );
  };

  // If user account is awaiting administrator approval, hide all workspace details and render holding screen
  if (permissions.isPendingApproval) {
    return <PendingAccessView />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8] dark:bg-[#111216] text-[#1C1C1A] dark:text-[#E8EAEF]">
      {/* ─── Desktop Sidebar (240px, clean calm neutral) ────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F8F8F6] dark:bg-[#16181D] md:flex">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-[#E8E8E3] dark:border-[#2B2E36]">
          <Logo size="sm" href="/" />
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Section 1: WORKSPACE */}
          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#969690]">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {workspaceNavItems.map((item) => {
                const Icon = item.icon;
                const isSearch = item.label === 'Search';
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/app/dashboard'}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                          : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#EFEFEB] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 ${
                              isActive
                                ? 'text-[#29483A] dark:text-[#78C295]'
                                : 'text-[#969690] group-hover:text-[#1C1C1A] dark:group-hover:text-[#E8EAEF]'
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {isSearch && (
                          <kbd className="hidden sm:inline-block rounded border border-[#E8E8E3] dark:border-[#323640] bg-[#FFFFFF] dark:bg-[#1D2026] px-1 py-0.5 font-mono text-[10px] text-[#969690]">
                            ⌘K
                          </kbd>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Section 2: WORKSPACE MANAGEMENT */}
          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#969690]">
              Management
            </div>
            <nav className="space-y-0.5">
              {managementNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href + item.label}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                          : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#EFEFEB] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 ${
                              isActive
                                ? 'text-[#29483A] dark:text-[#78C295]'
                                : 'text-[#969690] group-hover:text-[#1C1C1A] dark:group-hover:text-[#E8EAEF]'
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="flex h-4 min-w-[18px] items-center justify-center rounded-full bg-[#FEF7EE] dark:bg-[#3D2E18] px-1.5 text-[10px] font-bold text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Organization, Settings, User Profile */}
        <div className="p-3 border-t border-[#E8E8E3] dark:border-[#2B2E36] space-y-2">
          {/* Organization Switcher */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#1D2026] border border-[#E8E8E3] dark:border-[#2B2E36] shadow-subtle">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295]">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="overflow-hidden leading-none">
                <p className="truncate text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {activeOrg?.name || 'Acme Corporation'}
                </p>
                <p className="text-[10px] text-[#969690] mt-0.5">{activeOrg?.slug || 'acme-corp'}</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-1.5 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
              PRO
            </span>
          </div>

          {/* User Profile & Role with Popover Menu */}
          <div
            ref={userMenuRef}
            className="relative"
            onMouseEnter={handleUserMenuMouseEnter}
            onMouseLeave={handleUserMenuMouseLeave}
          >
            {userMenuOpen && (
              <>
                {/* Backdrop overlay for outside click dismissal */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />

                {/* Dropdown Menu popped above user button */}
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#1D2026] p-1.5 shadow-elevation z-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#E8E8E3] dark:border-[#2B2E36] mb-1">
                    <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] truncate">{user?.name}</p>
                    <p className="text-[11px] text-[#969690] truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-1.5 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
                      {permissions.roleLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/app/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Workspace Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-3.5 w-3.5" />
                    ) : (
                      <Moon className="h-3.5 w-3.5" />
                    )}
                    <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                  </button>

                  <div className="my-1 border-t border-[#E8E8E3] dark:border-[#2B2E36]" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      useUserApprovalStore.getState().simulateApprovalWelcome(permissions.role, 'Platform Engineering');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                  >
                    <PartyPopper className="h-3.5 w-3.5 text-[#275B3D] dark:text-[#78C295]" />
                    <span>Role Capabilities Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#C53030] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1919] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}

            {/* Trigger: User & Role Button */}
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex w-full items-center gap-2.5 p-1.5 sm:px-2 sm:py-2 rounded-lg transition-colors border ${
                userMenuOpen
                  ? 'bg-[#FFFFFF] dark:bg-[#1D2026] border-[#E8E8E3] dark:border-[#2B2E36] shadow-subtle'
                  : 'hover:bg-[#FFFFFF] dark:hover:bg-[#1D2026] border-transparent hover:border-[#E8E8E3] dark:hover:border-[#2B2E36]'
              }`}
              aria-expanded={userMenuOpen}
              aria-label="User profile and role menu"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-xs font-semibold leading-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-[#969690] capitalize truncate mt-0.5">
                  {permissions.roleLabel}
                </p>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-[#969690] shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Minimal Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] p-1.5 text-[#6B6B66] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Quick Search Button / Command Palette Trigger */}
            <button
              type="button"
              onClick={() => navigate('/app/search')}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 sm:px-3 py-1.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] hover:border-[#365B4B]/50 transition-colors w-full max-w-[150px] xs:max-w-[200px] sm:max-w-xs"
            >
              <Search className="h-3.5 w-3.5 text-[#969690] shrink-0" />
              <span className="truncate">Search decisions...</span>
              <kbd className="hidden sm:inline-block ml-auto font-mono text-[10px] text-[#969690]">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sync Status (compact on small screens) */}
            <div className="hidden xs:flex items-center">
              {renderSyncIndicator()}
            </div>

            {/* Owner Pending Notification */}
            {permissions.isOwner && pendingCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/app/teams')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#F8DCBA] dark:border-[#5C4524] bg-[#FEF7EE] dark:bg-[#2A2318] px-2.5 py-1 text-xs font-medium text-[#9A5B13] dark:text-[#F3B367] hover:bg-[#FDF2E2] transition-colors"
              >
                <span>{pendingCount} review pending</span>
              </button>
            )}

            {/* ─── Real-Time Notification Center ─────────────────────────────── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex items-center justify-center h-8 w-8 rounded-lg text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors border border-transparent hover:border-[#E8E8E3] dark:hover:border-[#2B2E36]"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {displayUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#365B4B] px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#16181D]">
                    {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#1A1C22] shadow-elevation z-50 overflow-hidden flex flex-col max-h-[480px]">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F9F9F8] dark:bg-[#16181D]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1C1C1A] dark:text-[#E8EAEF]">
                          Notifications
                        </span>
                        {displayUnreadCount > 0 && (
                          <span className="rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] px-1.5 py-0.2 text-[10px] font-semibold text-[#29483A] dark:text-[#78C295]">
                            {displayUnreadCount} new
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {displayUnreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="flex items-center gap-1 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] px-1.5 py-0.5 rounded hover:bg-[#EAEAE6] dark:hover:bg-[#252830] transition-colors"
                            title="Mark all as read"
                          >
                            <CheckCheck className="h-3 w-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto divide-y divide-[#E8E8E3]/60 dark:divide-[#2B2E36]/60 flex-1">
                      {displayNotifications.length === 0 ? (
                        <div className="py-8 text-center text-[#969690] px-4">
                          <Bell className="h-7 w-7 mx-auto mb-2 opacity-40 stroke-1" />
                          <p className="text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">No notifications yet</p>
                          <p className="text-[11px] text-[#969690] mt-0.5">
                            When teammates create or update decisions, notifications will appear here live.
                          </p>
                        </div>
                      ) : (
                        displayNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              setNotificationsOpen(false);
                              if (n.isOwnerProposal && !n.acknowledgedDialog) {
                                openProposalDialog(n);
                              } else if (n.decisionId) {
                                navigate(`/app/decisions/${n.decisionId}`);
                              } else {
                                navigate('/app/decisions');
                              }
                            }}
                            className={`p-3 text-left transition-colors cursor-pointer flex gap-2.5 hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] ${
                              !n.read ? 'bg-[#365B4B]/5 dark:bg-[#365B4B]/10' : ''
                            }`}
                          >
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                              n.isOwnerProposal
                                ? 'bg-[#FEF7EE] dark:bg-[#2A2318] text-[#D97706] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]'
                                : 'bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295]'
                            }`}>
                              {n.isOwnerProposal ? (
                                <Crown className="h-3.5 w-3.5" />
                              ) : (
                                n.author?.name ? n.author.name.charAt(0).toUpperCase() : 'D'
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] truncate">
                                    {n.title}
                                  </span>
                                  {n.isOwnerProposal && (
                                    <span className="rounded bg-[#FEF7EE] dark:bg-[#2A2318] px-1 py-0.2 text-[9px] font-bold text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524] shrink-0">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#969690] shrink-0">
                                  {formatTimeAgo(n.createdAt)}
                                </span>
                              </div>

                              <p className="text-[11px] text-[#555550] dark:text-[#B0B3BE] line-clamp-2 mt-0.5 leading-snug">
                                {n.message}
                              </p>

                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#969690]">
                                {n.team && (
                                  <span className="font-medium bg-[#EAEAE6] dark:bg-[#252830] text-[#4A4A45] dark:text-[#B0B3BE] px-1.5 py-0.2 rounded">
                                    {n.team}
                                  </span>
                                )}
                                {n.decisionNumber && (
                                  <span className="font-mono text-[#29483A] dark:text-[#78C295]">
                                    ADR-{String(n.decisionNumber).padStart(3, '0')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {!n.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#365B4B] shrink-0 mt-2 self-start" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Popover Footer */}
                    <div className="px-3 py-2 border-t border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F9F9F8] dark:bg-[#16181D] text-center">
                      <NavLink
                        to="/app/decisions"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-medium text-[#29483A] dark:text-[#78C295] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Browse All Decisions</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </NavLink>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Primary Action Button (positioned prominently in top header) */}
            {permissions.canCreateDecisions ? (
              <button
                type="button"
                onClick={() => navigate('/app/decisions/new')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white shadow-subtle transition-colors shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">New Decision</span>
                <span className="xs:hidden">New</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2 sm:px-2.5 py-1 text-xs text-[#969690]"
                title="Stakeholders have read-only permissions"
              >
                <Lock className="h-3 w-3" />
                <span className="hidden xs:inline text-[11px]">Read-Only</span>
              </div>
            )}
          </div>
        </header>

        {/* ─── Mobile Sidebar Overlay ──────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col bg-[#FFFFFF] dark:bg-[#16181D] p-4 shadow-elevation">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3] dark:border-[#2B2E36]">
                <Logo size="sm" href="/" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-[#969690] hover:bg-[#F5F5F2]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="mt-4 flex-1 space-y-1">
                {[...workspaceNavItems, ...managementNavItems].map((item) => (
                  <NavLink
                    key={item.href + item.label}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium ${
                        isActive
                          ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                          : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2]'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-3 space-y-2">
                {/* Mobile User & Role info */}
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#F5F5F2] dark:bg-[#1D2026]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] truncate leading-tight">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[10px] text-[#969690] capitalize truncate mt-0.5">
                      {permissions.roleLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 px-1">
                  <NavLink
                    to="/app/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Settings</span>
                  </NavLink>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                    title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                  >
                    {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-[#C53030] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1919] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Page Outlet ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#FAFAF8] dark:bg-[#111216]">
          <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
            {/* ─── Offline-First Notification Banner ─────────────────────── */}
            {(!sync.isOnline || sync.status === 'offline' || sync.isSimulatedOffline) && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#F8DCBA] dark:border-[#5C4524] bg-[#FEF7EE] dark:bg-[#2A2318] p-3.5 sm:px-4 text-xs text-[#9A5B13] dark:text-[#F3B367] shadow-subtle animate-in fade-in">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <WifiOff className="h-4 w-4 shrink-0 text-[#D97706] mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                      Offline-First Mode Active
                    </p>
                    <p className="text-[11px] text-[#9A5B13] dark:text-[#F3B367] opacity-90 mt-0.5">
                      Zero network dependency. Decisions, drafts, and reviews are saved directly to your local IndexedDB sandbox and will synchronize when connection resumes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                  {sync.pendingCount > 0 && (
                    <span className="rounded bg-[#F8DCBA]/80 dark:bg-[#5C4524]/80 px-2 py-0.5 text-[10px] font-bold font-mono">
                      {sync.pendingCount} queued
                    </span>
                  )}
                  {sync.isSimulatedOffline ? (
                    <button
                      type="button"
                      onClick={() => syncEngine.setSimulatedOffline(false)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#365B4B] hover:bg-[#29483A] text-white px-2.5 py-1 text-xs font-semibold shadow-subtle transition-colors"
                    >
                      Disable Simulation
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => syncEngine.processOutbox()}
                      className="inline-flex items-center gap-1 rounded-md bg-[#9A5B13] hover:bg-[#7D480E] text-white px-2.5 py-1 text-xs font-semibold shadow-subtle transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Recheck</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <Outlet />
          </div>
        </main>
      </div>

      {/* ─── Floating Real-Time Decision Notification Toast ──────────────── */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-32px)] sm:w-96 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="rounded-xl border border-[#C6E4D1] dark:border-[#284936] bg-[#FFFFFF] dark:bg-[#1A1C22] p-3.5 shadow-elevation flex gap-3 items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295]">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {activeToast.title}
                </span>
                <button
                  type="button"
                  onClick={() => dismissToast()}
                  className="rounded p-0.5 text-[#969690] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xs text-[#555550] dark:text-[#B0B3BE] mt-0.5 leading-snug">
                {activeToast.message}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    markAsRead(activeToast.id);
                    dismissToast();
                    if (activeToast.decisionId) {
                      navigate(`/app/decisions/${activeToast.decisionId}`);
                    } else {
                      navigate('/app/decisions');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-[#365B4B] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#29483A] shadow-subtle transition-colors"
                >
                  <span>View Decision</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={() => dismissToast()}
                  className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] px-2 py-1 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Architectural Decision Proposal Dialogue Box ─────────────── */}
      <NewDecisionProposalModal />

      {/* ─── Approved Access Welcome & Role Capabilities Dialogue Box ───── */}
      <RoleWelcomeModal />
    </div>
  );
}
