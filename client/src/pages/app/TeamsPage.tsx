import { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  CheckCircle2,
  FolderTree,
  Lock,
  Search,
  Info,
  Clock,
  UserCheck,
  UserX,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/lib/constants';
import {
  organizationService,
  OrgRosterResponse,
  OrgPendingApproval,
  OrgRosterMember,
} from '@/services/organizationService';

interface TeamMemberDisplay {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
  status: 'active' | 'invited' | 'pending';
  joinedAt?: string;
}

export function TeamsPage() {
  const { user } = useAuth();
  const permissions = usePermissions();

  const [rosterData, setRosterData] = useState<OrgRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Per-pending-user role & team selection by the Owner
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState<string>('');
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null);

  const loadRoster = async (showSpinner = true) => {
    try {
      if (showSpinner) setRefreshing(true);
      const data = await organizationService.getRoster();
      setRosterData(data);
      setError(null);
      // Sync global approval badge in layout & dashboard
      useUserApprovalStore.getState().fetchFromApi();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organization roster');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoster(false);
  }, []);

  const isOwner = rosterData ? rosterData.isOwner : permissions.isOwner;
  const pendingApprovals: OrgPendingApproval[] = rosterData?.pendingApprovals || [];

  const activeMembers: TeamMemberDisplay[] = useMemo(() => {
    if (!rosterData) return [];
    return rosterData.members.map((m: OrgRosterMember) => ({
      id: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      team: m.team,
      status: m.status,
      joinedAt: m.joinedAt,
    }));
  }, [rosterData]);

  const filteredMembers = useMemo(() => {
    return activeMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.team.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeMembers, search]);

  const teams = useMemo(() => {
    if (!rosterData || !rosterData.teams.length) {
      return [
        {
          id: 't-1',
          name: 'Platform Engineering',
          description: 'Core infrastructure, offline synchronization engines, and backend microservices.',
          membersCount: activeMembers.filter((m) => m.team === 'Platform Engineering').length || 2,
        },
        {
          id: 't-2',
          name: 'Product & Design',
          description: 'Design systems, user experience standards, and product specification ADRs.',
          membersCount: activeMembers.filter((m) => m.team === 'Product & Design').length || 1,
        },
      ];
    }
    return rosterData.teams;
  }, [rosterData, activeMembers]);

  const handleApprove = async (approval: OrgPendingApproval) => {
    const assignedRole = selectedRoles[approval.userId] || 'member';
    const assignedTeam =
      selectedTeams[approval.userId] || (teams[0]?.name ?? 'Platform Engineering');

    try {
      setSubmittingUserId(approval.userId);
      await organizationService.assignRole(approval.userId, assignedRole, assignedTeam);
      setActionNotice(
        `Approved ${approval.name} (${approval.email}) as ${assignedRole.toUpperCase()} in ${assignedTeam}.`
      );
      await loadRoster(false);
      setTimeout(() => setActionNotice(''), 4500);
    } catch (err: any) {
      setActionNotice(`Approval failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingUserId(null);
    }
  };

  const handleReject = async (approval: OrgPendingApproval) => {
    if (!window.confirm(`Are you sure you want to deny registration access for ${approval.name} (${approval.email})?`)) {
      return;
    }

    try {
      setSubmittingUserId(approval.userId);
      await organizationService.rejectRequest(approval.userId);
      setActionNotice(`Access request for ${approval.name} has been denied.`);
      await loadRoster(false);
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err: any) {
      setActionNotice(`Deny request failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingUserId(null);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
    setTimeout(() => {
      setInviteSuccess('');
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
    }, 1500);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'owner':
        return 'bg-[#FEF7EE] text-[#9A5B13] border-[#F8DCBA] dark:bg-[#2A2318] dark:text-[#F3B367] dark:border-[#4D391A]';
      case 'admin':
        return 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#251B38] dark:text-[#C4B5FD] dark:border-[#4C3872]';
      case 'member':
        return 'bg-[#EBF5EE] text-[#275B3D] border-[#C6E4D1] dark:bg-[#192B21] dark:text-[#78C295] dark:border-[#284936]';
      case 'viewer':
        return 'bg-[#F4F4F0] text-[#6B6B66] border-[#E8E8E3] dark:bg-[#20222B] dark:text-[#9E9EA8] dark:border-[#2E313D]';
    }
  };

  if (loading && !rosterData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#365B4B]" />
        <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">Loading workspace roster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl">
            Teams & Access Governance
          </h1>
          <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
            Manage engineering groups, review pending registrations, and configure role privileges in Acme Corporation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadRoster(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-3 py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] shadow-subtle hover:bg-[#F5F5F2] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#365B4B]' : 'text-[#969690]'}`} />
            <span>Sync</span>
          </button>

          {isOwner ? (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Direct Invite</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-2 text-xs text-[#969690]">
              <Lock className="h-3.5 w-3.5" />
              <span>Managed by Owner</span>
            </div>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="rounded-lg border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE] dark:bg-[#192B21] p-3 text-xs font-medium text-[#275B3D] dark:text-[#78C295] flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#F8D7DA] dark:border-[#532626] bg-[#FDF2F2] dark:bg-[#2F1D1D] p-3 text-xs text-[#9B2C2C] dark:text-[#F08C8C]">
          {error}
        </div>
      )}

      {/* ─── Pending Approvals Queue (DECIDED BY OWNER) ──────────────────── */}
      <div className="rounded-xl border border-[#F8DCBA] dark:border-[#5C4524] bg-[#FEF7EE]/60 dark:bg-[#2A2318]/50 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8DCBA] dark:bg-[#5C4524] text-[#9A5B13] dark:text-[#F3B367]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] flex items-center gap-2">
                <span>New Account Requests</span>
                <span className="rounded-full bg-[#F8DCBA] dark:bg-[#5C4524] px-2 py-0.5 text-[10px] font-bold text-[#9A5B13] dark:text-[#F3B367]">
                  {pendingApprovals.length} Pending
                </span>
              </h2>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
                All newly created accounts must be reviewed and given an engineering role by the Organization Owner.
              </p>
            </div>
          </div>

          {isOwner && (
            <span className="text-[11px] font-medium text-[#9A5B13] dark:text-[#F3B367]">
              Decision Authority: Owner
            </span>
          )}
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="space-y-3 pt-1">
            {pendingApprovals.map((req) => {
              const isProcessing = submittingUserId === req.userId;
              return (
                <div
                  key={req.userId}
                  className="flex flex-col gap-4 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
                      {req.name ? req.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1C1C1A] dark:text-[#E8EAEF]">
                          {req.name}
                        </span>
                        <span className="rounded bg-[#FEF7EE] dark:bg-[#2A2318] px-1.5 py-0.5 text-[10px] font-medium text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
                          Awaiting Role
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] font-mono mt-0.5">
                        {req.email}
                      </p>
                      <p className="text-[11px] text-[#969690] mt-0.5">
                        Registered:{' '}
                        {req.registeredAt || req.joinedAt
                          ? new Date(req.registeredAt || req.joinedAt!).toLocaleString()
                          : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {isOwner ? (
                    <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t border-[#E8E8E3] dark:border-[#2B2E36] lg:border-t-0">
                      {/* Role selection */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-[#969690] uppercase">
                          Role:
                        </span>
                        <select
                          value={selectedRoles[req.userId] || 'member'}
                          disabled={isProcessing}
                          onChange={(e) =>
                            setSelectedRoles({ ...selectedRoles, [req.userId]: e.target.value as Role })
                          }
                          className="h-8 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none"
                        >
                          <option value="member">Engineer (Member)</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Stakeholder (Viewer)</option>
                        </select>
                      </div>

                      {/* Team selection */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-[#969690] uppercase">
                          Team:
                        </span>
                        <select
                          value={selectedTeams[req.userId] || teams[0]?.name || 'Platform Engineering'}
                          disabled={isProcessing}
                          onChange={(e) =>
                            setSelectedTeams({ ...selectedTeams, [req.userId]: e.target.value })
                          }
                          className="h-8 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none"
                        >
                          {teams.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end pt-4 lg:pt-0">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-3 py-1.5 text-xs font-semibold text-white shadow-subtle transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          <span>Approve & Assign</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReject(req)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-2.5 py-1.5 text-xs font-medium text-[#C53030] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1919] transition-colors disabled:opacity-50"
                          title="Deny request"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[#6B6B66] dark:text-[#9E9EA8] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-2 rounded-lg">
                      <Lock className="h-3.5 w-3.5" />
                      <span>
                        {user?.email?.toLowerCase() === req.email.toLowerCase()
                          ? 'Your account is pending review by Sarah Chen (Owner).'
                          : 'Awaiting Owner decision.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE] dark:bg-[#192B21] p-3 text-xs text-[#275B3D] dark:text-[#78C295]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>All registered accounts have been reviewed and assigned roles.</span>
          </div>
        )}
      </div>

      {/* ─── Stakeholder Banner if Viewer ─────────────────────────────────── */}
      {permissions.isViewer && (
        <div className="rounded-xl border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE]/50 dark:bg-[#192B21]/30 p-4 text-xs text-[#275B3D] dark:text-[#78C295] flex items-start gap-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Stakeholder (Read-Only) Perspective</p>
            <p className="mt-0.5 opacity-90">
              You are signed in with Stakeholder review rights. You can view teams, member rosters, and all decision rationales. Team membership modifications and role assignments require Owner privileges.
            </p>
          </div>
        </div>
      )}

      {/* ─── Engineering Groups Overview ──────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#969690]">
          Engineering Groups
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle hover:border-[#365B4B]/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295]">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                      {team.name}
                    </h3>
                    <p className="text-[11px] text-[#969690]">
                      {team.name === 'Platform Engineering' ? 'Lead: Sarah Chen' : 'Lead: Jordan Lee'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8]">
                  {team.membersCount} members
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#6B6B66] dark:text-[#9E9EA8]">
                {team.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Active Members Table ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E8E8E3] dark:border-[#2B2E36] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#F8F8F6] dark:bg-[#191C22]">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Active Organization Members
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
              {activeMembers.length} users with assigned roles in Acme Corporation
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#969690]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, team..."
              className="h-8 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] pl-8 pr-3 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF8] dark:bg-[#16181D] text-[#969690] uppercase text-[10px] font-semibold tracking-wider border-b border-[#E8E8E3] dark:border-[#2B2E36]">
              <tr>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Assigned Role</th>
                <th className="py-2.5 px-4">Team</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E3] dark:divide-[#2B2E36]">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-semibold text-[#29483A] dark:text-[#78C295]">
                        {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">{m.name}</p>
                        <p className="text-[11px] text-[#969690] font-mono">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold capitalize border ${getRoleBadge(
                        m.role
                      )}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6B6B66] dark:text-[#9E9EA8] font-medium">
                    {m.team}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#275B3D] dark:text-[#78C295]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#275B3D]" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── RBAC Reference Guide ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#969690]">
          <Shield className="h-4 w-4 text-[#365B4B] dark:text-[#78C295]" />
          <span>RBAC Privilege Hierarchy Reference</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#191C22] p-3">
            <span className="font-semibold text-[#9A5B13] dark:text-[#F3B367]">Owner</span>
            <p className="mt-1 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
              Full workspace governance, new user role assignment, team creation, and org administration.
            </p>
          </div>
          <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#191C22] p-3">
            <span className="font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">Admin</span>
            <p className="mt-1 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
              Manage member invitations, team moderation, and review decisions.
            </p>
          </div>
          <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#191C22] p-3">
            <span className="font-semibold text-[#275B3D] dark:text-[#78C295]">Member (Engineer)</span>
            <p className="mt-1 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
              Author architectural decision records, propose revisions, cast peer votes, and update docs.
            </p>
          </div>
          <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#191C22] p-3">
            <span className="font-semibold text-[#6B6B66] dark:text-[#A0A09B]">Stakeholder (Viewer)</span>
            <p className="mt-1 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
              Read-only transparency across all ADRs, search historical rationales, and audit compliance.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Direct Invite Modal ──────────────────────────────────────────── */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 shadow-elevation space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Direct Invite Team Member
              </h3>
              <p className="mt-0.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
                Pre-assign a role and send an onboarding invitation to Acme Corporation.
              </p>
            </div>

            {inviteSuccess ? (
              <div className="rounded-lg border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE] dark:bg-[#192B21] p-3 text-center text-xs font-medium text-[#275B3D] dark:text-[#78C295]">
                {inviteSuccess}
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Taylor Morgan"
                    className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs focus:border-[#365B4B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="taylor@example.com"
                    className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs focus:border-[#365B4B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                    Role Tier
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs focus:border-[#365B4B] focus:outline-none"
                  >
                    <option value="member">Member (Engineer — Can author and edit)</option>
                    <option value="viewer">Viewer (Stakeholder — Read-only access)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-3 py-1.5 font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-1.5 font-semibold text-white shadow-subtle"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
