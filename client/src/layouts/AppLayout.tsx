import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  Building2,
  Lock,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useSyncStore } from '@/store/syncStore';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { Logo } from '@/components/ui/Logo';

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUIStore();
  const permissions = usePermissions();
  const sync = useSyncStore();
  const approvals = useUserApprovalStore((state) => state.approvals);
  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  useEffect(() => {
    useUserApprovalStore.getState().fetchFromApi();
  }, []);

  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const workspaceNavItems = [
    { label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Decisions', href: '/app/decisions', icon: FileText },
    { label: 'Search', href: '/app/search', icon: Search, shortcut: '⌘K' },
    { label: 'Teams', href: '/app/teams', icon: Users },
  ];

  const managementNavItems = [
    {
      label: 'Members & Roles',
      href: '/app/teams',
      icon: ShieldCheck,
      badge: permissions.isOwner && pendingCount > 0 ? pendingCount : undefined,
    },
    { label: 'Activity Log', href: '/app/activity', icon: Activity },
  ];

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  const renderSyncIndicator = () => {
    if (!sync.isOnline || sync.status === 'offline') {
      return (
        <div
          className="flex items-center gap-1.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] px-2.5 py-1 rounded-md bg-[#F5F5F2] dark:bg-[#1D2026] border border-[#E8E8E3] dark:border-[#2B2E36]"
          title="Working offline. Changes are saved locally."
        >
          <WifiOff className="h-3 w-3 text-[#969690]" />
          <span className="hidden sm:inline">Offline · Saved locally</span>
        </div>
      );
    }

    if (sync.status === 'syncing') {
      return (
        <div
          className="flex items-center gap-1.5 text-xs text-[#9A5B13] dark:text-[#F3B367] px-2.5 py-1 rounded-md bg-[#FEF7EE] dark:bg-[#2A2318] border border-[#F8DCBA] dark:border-[#4D391A]"
          title="Syncing changes with server"
        >
          <RefreshCw className="h-3 w-3 animate-spin text-[#D97706]" />
          <span className="hidden sm:inline">
            Syncing{sync.pendingCount > 0 ? ` ${sync.pendingCount} changes` : ''}...
          </span>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-1.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] px-2.5 py-1 rounded-md bg-transparent border border-transparent"
        title="All local changes saved and synced"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#365B4B]" />
        <span className="hidden sm:inline">All changes saved</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8] dark:bg-[#111216] text-[#1C1C1A] dark:text-[#E8EAEF]">
      {/* ─── Desktop Sidebar (240px, clean calm neutral) ────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F8F8F6] dark:bg-[#16181D] md:flex">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-[#E8E8E3] dark:border-[#2B2E36]">
          <Logo size="sm" href="/app/dashboard" />
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
                  Acme Corporation
                </p>
                <p className="text-[10px] text-[#969690] mt-0.5">acme-corp</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-1.5 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
              PRO
            </span>
          </div>

          {/* User & Settings bar */}
          <div className="flex items-center justify-between px-1">
            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                `flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'text-[#29483A] font-semibold dark:text-[#78C295]'
                    : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
                }`
              }
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </NavLink>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                className="p-1 rounded text-[#969690] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => logout()}
                title="Sign out"
                className="p-1 rounded text-[#969690] hover:text-[#C53030] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Minimal Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] p-1.5 text-[#6B6B66] hover:bg-[#F5F5F2] md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Quick Search Button / Command Palette Trigger */}
            <button
              type="button"
              onClick={() => navigate('/app/search')}
              className="flex items-center gap-2 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-1.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] hover:border-[#365B4B]/50 transition-colors w-48 sm:w-64"
            >
              <Search className="h-3.5 w-3.5 text-[#969690]" />
              <span className="truncate">Search decisions...</span>
              <kbd className="ml-auto font-mono text-[10px] text-[#969690]">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status */}
            {renderSyncIndicator()}

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

            {/* User Profile Avatar with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-semibold text-[#29483A] dark:text-[#78C295]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-medium leading-none text-[#1C1C1A] dark:text-[#E8EAEF]">
                    {user?.name?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-[#969690] capitalize mt-0.5">
                    {permissions.roleLabel}
                  </p>
                </div>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#1D2026] p-1.5 shadow-elevation z-50 text-xs"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#E8E8E3] dark:border-[#2B2E36] mb-1">
                    <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">{user?.name}</p>
                    <p className="text-[11px] text-[#969690] truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-1.5 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
                      {permissions.roleLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/app/settings')}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A]"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Workspace Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] hover:text-[#1C1C1A]"
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
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#C53030] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1919]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {permissions.canCreateDecisions ? (
              <button
                type="button"
                onClick={() => navigate('/app/decisions/new')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-3 py-1.5 text-xs font-semibold text-white shadow-subtle transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Decision</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 py-1 text-xs text-[#969690]"
                title="Stakeholders have read-only permissions"
              >
                <Lock className="h-3 w-3" />
                <span className="text-[11px]">Read-Only</span>
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
                <Logo size="sm" href="/app/dashboard" />
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

              <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-[#C53030] hover:bg-[#FDF2F2]"
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
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
