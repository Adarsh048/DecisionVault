import { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  User,
  Lock,
  Check,
  Loader2,
  AlertCircle,
  Database,
  WifiOff,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useOrganizationStore } from '@/store/organizationStore';
import { organizationService } from '@/services/organizationService';
import { useSyncStore } from '@/store/syncStore';
import { syncEngine } from '@/services/syncEngine';

export function SettingsPage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const sync = useSyncStore();
  const activeOrg = useOrganizationStore((state) => state.activeOrganization);
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security'>('general');

  // Form states
  const [orgName, setOrgName] = useState(activeOrg?.name || 'Acme Corporation');
  const [orgSlug, setOrgSlug] = useState(activeOrg?.slug || 'acme-corp');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync from store when activeOrg changes
  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name);
      setOrgSlug(activeOrg.slug);
    }
  }, [activeOrg?.name, activeOrg?.slug]);

  // Fetch latest organization details on initial mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    organizationService
      .getRoster()
      .then((data) => {
        if (!isMounted) return;
        if (data?.organization) {
          setOrgName(data.organization.name);
          setOrgSlug(data.organization.slug);
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
      })
      .catch((err) => {
        console.error('Failed to load organization roster in settings', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManageSettings) return;

    const trimmedName = orgName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setSaveError('Organization name must be at least 2 characters');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const orgIdOrSlug = activeOrg?._id || activeOrg?.slug || 'acme-corp';
      const res = await organizationService.updateOrganization(orgIdOrSlug, {
        name: trimmedName,
        slug: orgSlug.trim() || undefined,
      });

      const updated = res?.organization;
      if (updated) {
        setOrgName(updated.name);
        if (updated.slug) setOrgSlug(updated.slug);

        const current = useOrganizationStore.getState().activeOrganization;
        useOrganizationStore.getState().setActiveOrganization({
          ...(current || {
            _id: updated._id || updated.id || 'acme-corp',
            slug: updated.slug || 'acme-corp',
            owner: updated.owner || '',
            members: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
          name: updated.name,
          ...(updated.slug ? { slug: updated.slug } : {}),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update organization name', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update organization name. Please try again.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
          Workspace parameters, access governance, and profile credentials.
        </p>
      </div>

      {/* ─── Stakeholder Notice ────────────────────────────────────────────── */}
      {permissions.isViewer && (
        <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] p-3 text-xs text-[#6B6B66] dark:text-[#9E9EA8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#969690]" />
            <span>
              <strong>Stakeholder Mode:</strong> Settings are view-only. Modifications require Owner privileges.
            </span>
          </div>
          <span className="rounded border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2 py-0.5 text-[10px] font-medium">
            Audit Only
          </span>
        </div>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#E8E8E3] dark:border-[#2B2E36] text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`shrink-0 flex items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'general'
              ? 'border-b-2 border-[#365B4B] text-[#1C1C1A] dark:text-[#E8EAEF] font-semibold'
              : 'hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Workspace</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`shrink-0 flex items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'profile'
              ? 'border-b-2 border-[#365B4B] text-[#1C1C1A] dark:text-[#E8EAEF] font-semibold'
              : 'hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`shrink-0 flex items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'security'
              ? 'border-b-2 border-[#365B4B] text-[#1C1C1A] dark:text-[#E8EAEF] font-semibold'
              : 'hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Security</span>
        </button>
      </div>

      {/* ─── Tab Content: Workspace ───────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 sm:p-6 shadow-subtle space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Organization Details
              </h2>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                Primary identification parameters for your DecisionVault workspace.
              </p>
            </div>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#969690]">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
          </div>

          {saveError && (
            <div className="rounded-lg border border-[#F1C8C8] dark:border-[#522525] bg-[#FCF3F3] dark:bg-[#2C1818] p-3 text-xs text-[#BC3232] dark:text-[#E88181] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                Organization Name
              </label>
              <input
                type="text"
                disabled={!permissions.canManageSettings || isSaving}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Organization Name"
                className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs disabled:opacity-60 focus:border-[#365B4B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                Workspace Slug
              </label>
              <div className="flex rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] overflow-hidden">
                <span className="hidden sm:flex items-center px-3 text-[11px] text-[#969690] bg-[#F5F5F2] dark:bg-[#16181D] border-r border-[#E8E8E3] dark:border-[#2B2E36] shrink-0">
                  decisionvault.io/org/
                </span>
                <span className="flex sm:hidden items-center px-2.5 text-[11px] font-mono text-[#969690] bg-[#F5F5F2] dark:bg-[#16181D] border-r border-[#E8E8E3] dark:border-[#2B2E36] shrink-0">
                  org/
                </span>
                <input
                  type="text"
                  disabled={!permissions.canManageSettings || isSaving}
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="workspace-slug"
                  className="h-9 flex-1 min-w-0 px-3 text-xs bg-transparent disabled:opacity-60 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
              {saveSuccess ? (
                <span className="inline-flex items-center gap-1.5 text-[#275B3D] dark:text-[#78C295] font-medium text-xs">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Changes saved successfully</span>
                </span>
              ) : (
                <span />
              )}

              {permissions.canManageSettings && (
                <button
                  type="submit"
                  disabled={isSaving || !orgName.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── Tab Content: Profile ─────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 sm:p-6 shadow-subtle space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Your Profile
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Account identity associated with decision authorship and audit logging.
            </p>
          </div>

          <div className="flex items-center gap-4 py-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-base font-bold text-[#29483A] dark:text-[#78C295]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] truncate">
                {user?.name || 'Engineer'}
              </p>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] font-mono truncate">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-2 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
                {permissions.roleLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content: Security ────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 sm:p-6 shadow-subtle space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Security, Offline Vault & Cryptographic Verification
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              DecisionVault guarantees record immutability via signed revision logs and IndexedDB local-first sandboxing.
            </p>
          </div>

          {/* ── Offline-First IndexedDB Local Vault Panel ── */}
          <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295]">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-[#1C1C1A] dark:text-[#E8EAEF] flex items-center gap-2">
                    <span>Local IndexedDB Vault</span>
                    <span className="font-mono text-[10px] text-[#969690]">
                      ({sync.storageStats.dbName})
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
                    Zero-latency client storage with optimistic local writes and background outbox queue.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {!sync.isOnline || sync.status === 'offline' || sync.isSimulatedOffline ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7EE] dark:bg-[#2A2318] border border-[#F8DCBA] dark:border-[#5C4524] px-2.5 py-1 text-[11px] font-semibold text-[#9A5B13] dark:text-[#F3B367]">
                    <WifiOff className="h-3 w-3 text-[#D97706]" />
                    <span>Offline (Local Active)</span>
                  </span>
                ) : sync.status === 'syncing' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7EE] dark:bg-[#2A2318] border border-[#F8DCBA] dark:border-[#4D391A] px-2.5 py-1 text-[11px] font-semibold text-[#9A5B13] dark:text-[#F3B367]">
                    <RefreshCw className="h-3 w-3 animate-spin text-[#D97706]" />
                    <span>Syncing In-Flight</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5EE] dark:bg-[#192B21] border border-[#C6E4D1] dark:border-[#284936] px-2.5 py-1 text-[11px] font-semibold text-[#275B3D] dark:text-[#78C295]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#275B3D]" />
                    <span>Vault Synced</span>
                  </span>
                )}
              </div>
            </div>

            {/* Storage Metric Badges */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-3">
                <span className="text-[10px] uppercase font-semibold text-[#969690]">
                  IndexedDB Decisions
                </span>
                <p className="text-xl font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                  {sync.storageStats.decisionCount}
                </p>
                <p className="text-[10px] text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                  Persistent local records
                </p>
              </div>

              <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-3">
                <span className="text-[10px] uppercase font-semibold text-[#969690]">
                  Outbox Queue
                </span>
                <p className="text-xl font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                  {sync.pendingCount}
                </p>
                <p className="text-[10px] text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                  Mutations awaiting sync
                </p>
              </div>

              <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-3">
                <span className="text-[10px] uppercase font-semibold text-[#969690]">
                  Last Reconciliation
                </span>
                <p className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] mt-1.5 truncate">
                  {sync.lastSyncedAt ? sync.lastSyncedAt.toLocaleTimeString() : 'Pending'}
                </p>
                <p className="text-[10px] text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                  Server timestamp
                </p>
              </div>
            </div>

            {/* Interactive Vault Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => syncEngine.setSimulatedOffline(!sync.isSimulatedOffline)}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-semibold shadow-subtle transition-colors ${
                    sync.isSimulatedOffline
                      ? 'bg-[#9A5B13] hover:bg-[#7D480E] text-white border border-[#9A5B13]'
                      : 'border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2]'
                  }`}
                >
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>
                    {sync.isSimulatedOffline
                      ? 'Simulated Offline Active (Click to Online)'
                      : 'Simulate Offline Mode'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => syncEngine.processOutbox()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-3 py-2 sm:py-1.5 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Force Sync Outbox</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => syncEngine.resetAndReseed()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-2.5 py-1.5 text-xs text-[#969690] hover:text-[#1C1C1A] hover:bg-[#F5F5F2] transition-colors"
                title="Resets local IndexedDB tables back to initial seed data"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Re-seed Vault</span>
              </button>
            </div>
          </div>

          {/* Session Security */}
          <div className="p-3.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">Session Security</p>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                Token rotation and refresh hashes active. Expiration triggers a security dialog.
              </p>
            </div>
            <button
              type="button"
              onClick={() => useAuthStore.getState().setSessionExpired(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-3.5 py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors shrink-0 shadow-subtle"
            >
              Test Session Over Dialog
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
