import { useState } from 'react';
import {
  Building2,
  Shield,
  User,
  Key,
  Lock,
  Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

export function SettingsPage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security' | 'api'>('general');

  // Form states
  const [orgName, setOrgName] = useState('Acme Corporation');
  const [orgSlug, setOrgSlug] = useState('acme-corp');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
      <div className="flex border-b border-[#E8E8E3] dark:border-[#2B2E36] text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors ${
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
          className={`flex items-center gap-1.5 pb-2.5 transition-colors ${
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
          className={`flex items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'security'
              ? 'border-b-2 border-[#365B4B] text-[#1C1C1A] dark:text-[#E8EAEF] font-semibold'
              : 'hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Security</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors ${
            activeTab === 'api'
              ? 'border-b-2 border-[#365B4B] text-[#1C1C1A] dark:text-[#E8EAEF] font-semibold'
              : 'hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF]'
          }`}
        >
          <Key className="h-3.5 w-3.5" />
          <span>Developer API</span>
        </button>
      </div>

      {/* ─── Tab Content: Workspace ───────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 shadow-subtle space-y-5 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Organization Details
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Primary identification parameters for your DecisionVault workspace.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                Organization Name
              </label>
              <input
                type="text"
                disabled={!permissions.canManageSettings}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs disabled:opacity-60 focus:border-[#365B4B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                Workspace Slug
              </label>
              <div className="flex rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] overflow-hidden">
                <span className="flex items-center px-3 text-[11px] text-[#969690] bg-[#F5F5F2] dark:bg-[#16181D] border-r border-[#E8E8E3] dark:border-[#2B2E36]">
                  decisionvault.io/org/
                </span>
                <input
                  type="text"
                  disabled={!permissions.canManageSettings}
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="h-9 flex-1 px-3 text-xs bg-transparent disabled:opacity-60 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
              {saveSuccess ? (
                <span className="inline-flex items-center gap-1 text-[#275B3D] dark:text-[#78C295] font-medium text-xs">
                  <Check className="h-3.5 w-3.5" />
                  <span>Changes saved successfully</span>
                </span>
              ) : (
                <span />
              )}

              {permissions.canManageSettings && (
                <button
                  type="submit"
                  className="rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── Tab Content: Profile ─────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 shadow-subtle space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Your Profile
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Account identity associated with decision authorship and audit logging.
            </p>
          </div>

          <div className="flex items-center gap-4 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-base font-bold text-[#29483A] dark:text-[#78C295]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                {user?.name || 'Engineer'}
              </p>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] font-mono">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-2 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
                {permissions.roleLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content: Security ────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 shadow-subtle space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Security & Cryptographic Verification
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              DecisionVault guarantees record immutability via signed revision logs.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026]">
              <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">Session Security</p>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                Token rotation and refresh hashes active. Idle timeouts enforced.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026]">
              <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">IndexedDB Local Vault</p>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                Offline records are isolated within the browser storage sandbox.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content: API ─────────────────────────────────────────────── */}
      {activeTab === 'api' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 shadow-subtle space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Developer APIs & Webhooks
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Integrate DecisionVault directly into GitHub Actions or internal CI/CD checks.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] space-y-2">
            <p className="font-mono text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
              API Base URL: <span className="text-[#1C1C1A] dark:text-[#E8EAEF]">http://localhost:5000/api/v1</span>
            </p>
            <p className="text-[11px] text-[#969690]">
              Bearer authentication headers required on all protected endpoints.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
