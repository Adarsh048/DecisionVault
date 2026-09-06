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
  Users,
  Edit3,
  Trash2,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserApprovalStore } from '@/store/userApprovalStore';
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
  const permissions = usePermissions();

  const [rosterData, setRosterData] = useState<OrgRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state: 'grouped' (Teams with nested members & roles), 'table' (Directory), 'roles' (Role hierarchy)
  const [viewMode, setViewMode] = useState<'grouped' | 'table' | 'roles'>('grouped');
  const [search, setSearch] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Direct invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [inviteTeam, setInviteTeam] = useState<string>('Platform Engineering');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Member role & team edit modal
  const [editingMember, setEditingMember] = useState<TeamMemberDisplay | null>(null);
  const [editRole, setEditRole] = useState<Role>('member');
  const [editTeam, setEditTeam] = useState<string>('Platform Engineering');
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Per-pending-user role & team selection
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
      // Sync global approval badge
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
  const isAdmin = permissions.isAdmin || isOwner || Boolean((rosterData as any)?.isAdmin);
  const pendingApprovals: OrgPendingApproval[] = useMemo(() => {
    if (!rosterData?.pendingApprovals) return [];
    return [...rosterData.pendingApprovals].sort((a, b) => {
      const timeA = new Date(a.registeredAt || a.joinedAt || 0).getTime();
      const timeB = new Date(b.registeredAt || b.joinedAt || 0).getTime();
      return timeB - timeA; // Latest first, early at the bottom
    });
  }, [rosterData?.pendingApprovals]);

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

  // Filtered members according to search and dropdowns
  const filteredMembers = useMemo(() => {
    return activeMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.team.toLowerCase().includes(search.toLowerCase()) ||
        m.role.toLowerCase().includes(search.toLowerCase());

      const matchesTeam =
        selectedTeamFilter === 'all' || m.team.toLowerCase() === selectedTeamFilter.toLowerCase();

      const matchesRole =
        selectedRoleFilter === 'all' || m.role.toLowerCase() === selectedRoleFilter.toLowerCase();

      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [activeMembers, search, selectedTeamFilter, selectedRoleFilter]);

  // Team-grouped members
  const teamGroupedData = useMemo(() => {
    return teams.map((team) => {
      const membersInTeam = filteredMembers.filter(
        (m) => m.team.toLowerCase() === team.name.toLowerCase()
      );
      return {
        ...team,
        members: membersInTeam,
      };
    });
  }, [teams, filteredMembers]);

  const handleApprove = async (approval: OrgPendingApproval) => {
    const assignedRole = selectedRoles[approval.userId] || 'member';
    const assignedTeam =
      selectedTeams[approval.userId] || (teams[0]?.name ?? 'Platform Engineering');

    try {
      setSubmittingUserId(approval.userId);
      await organizationService.assignRole(approval.userId, assignedRole, assignedTeam);
      await useUserApprovalStore.getState().approveUser(approval.userId, assignedRole, assignedTeam);
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
    if (
      !window.confirm(
        `Are you sure you want to deny registration access for ${approval.name} (${approval.email})?`
      )
    ) {
      return;
    }

    try {
      setSubmittingUserId(approval.userId);
      await organizationService.rejectRequest(approval.userId);
      await useUserApprovalStore.getState().rejectUser(approval.userId);
      setActionNotice(`Access request for ${approval.name} has been denied.`);
      await loadRoster(false);
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err: any) {
      setActionNotice(`Deny request failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingUserId(null);
    }
  };

  const handleOpenEditMember = (member: TeamMemberDisplay) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditTeam(member.team);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setIsUpdatingMember(true);
      await organizationService.assignRole(editingMember.id, editRole, editTeam);
      setActionNotice(
        `Updated ${editingMember.name}: Role set to ${editRole.toUpperCase()} in ${editTeam}.`
      );
      setEditingMember(null);
      await loadRoster(false);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      setActionNotice(`Update failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!editingMember) return;

    if (
      editingMember.role === 'owner' ||
      editingMember.id === rosterData?.organization?.owner
    ) {
      alert('The Organization Owner cannot be removed from the workspace.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${editingMember.name} (${editingMember.email}) from this workspace?\n\nThis will revoke all their permissions and remove them from all teams.`
    );
    if (!confirmed) return;

    try {
      setIsRemovingMember(true);
      const orgId = rosterData?.organization?.id || 'acme-corp';
      await organizationService.removeMember(orgId, editingMember.id);
      setActionNotice(`Successfully removed ${editingMember.name} from the organization.`);
      setEditingMember(null);
      await loadRoster(false);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      setActionNotice(`Failed to remove member: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteSuccess(`Invitation sent to ${inviteEmail} for ${inviteTeam} as ${inviteRole.toUpperCase()}!`);
    setTimeout(() => {
      setInviteSuccess('');
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
    }, 1600);
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
        <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">Loading workspace roster & teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl flex items-center gap-2.5">
            <span>Teams, Members & Roles</span>
          </h1>
          <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
            Unified workspace directory: engineering teams, active members, privilege tiers, and governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadRoster(true)}
            disabled={refreshing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-3 py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] shadow-subtle hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#365B4B]' : 'text-[#969690]'}`} />
            <span>Sync</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Direct Invite</span>
            </button>
          ) : (
            <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-2 text-xs text-[#969690]">
              <Lock className="h-3.5 w-3.5" />
              <span>Managed by Admin</span>
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

      {/* ─── Pending Approvals Queue (VISIBLE ONLY TO ADMINS) ───────────── */}
      {isAdmin && (
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
                  All newly created accounts must be reviewed and given an engineering role by an Administrator or Owner.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-medium text-[#9A5B13] dark:text-[#F3B367]">
              Decision Authority: Admin
            </span>
          </div>

          {pendingApprovals.length > 0 ? (
            <div className="space-y-3 pt-1">
              {pendingApprovals.map((req) => {
                const isProcessing = submittingUserId === req.userId;
                return (
                  <div
                    key={req.userId}
                    className="flex flex-col gap-4 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-3 sm:p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
                        {req.name ? req.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-[#1C1C1A] dark:text-[#E8EAEF] truncate">
                            {req.name}
                          </span>
                          <span className="rounded bg-[#FEF7EE] dark:bg-[#2A2318] px-1.5 py-0.5 text-[10px] font-medium text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
                            Awaiting Role
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] font-mono mt-0.5 truncate">
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

                    <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-end gap-2.5 pt-3 lg:pt-0 border-t border-[#E8E8E3] dark:border-[#2B2E36] lg:border-t-0 w-full lg:w-auto">
                      {/* Role selection */}
                      <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[130px]">
                        <span className="text-[10px] font-semibold text-[#969690] uppercase">
                          Role:
                        </span>
                        <select
                          value={selectedRoles[req.userId] || 'member'}
                          disabled={isProcessing}
                          onChange={(e) =>
                            setSelectedRoles({ ...selectedRoles, [req.userId]: e.target.value as Role })
                          }
                          className="h-8 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none w-full"
                        >
                          <option value="member">Engineer (Member)</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Stakeholder (Viewer)</option>
                        </select>
                      </div>

                      {/* Team selection */}
                      <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[140px]">
                        <span className="text-[10px] font-semibold text-[#969690] uppercase">
                          Team:
                        </span>
                        <select
                          value={selectedTeams[req.userId] || teams[0]?.name || 'Platform Engineering'}
                          disabled={isProcessing}
                          onChange={(e) =>
                            setSelectedTeams({ ...selectedTeams, [req.userId]: e.target.value })
                          }
                          className="h-8 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none w-full"
                        >
                          {teams.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1 sm:pt-0 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-subtle transition-colors disabled:opacity-50 flex-1 sm:flex-none h-8"
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
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-2.5 py-1.5 text-xs font-medium text-[#C53030] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1919] transition-colors disabled:opacity-50 shrink-0 h-8"
                          title="Deny request"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
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
      )}

      {/* ─── Stakeholder Banner if Viewer ─────────────────────────────────── */}
      {permissions.isViewer && (
        <div className="rounded-xl border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE]/50 dark:bg-[#192B21]/30 p-4 text-xs text-[#275B3D] dark:text-[#78C295] flex items-start gap-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Stakeholder (Read-Only) Perspective</p>
            <p className="mt-0.5 opacity-90">
              You are signed in with Stakeholder review rights. You can view teams, member rosters, and all decision rationales. Team membership modifications and role assignments require Administrator privileges.
            </p>
          </div>
        </div>
      )}

      {/* ─── Unified View Toolbar: Mode Tabs & Live Filters ─────────────── */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-3">
          {/* Mode Tabs: Grouped by Teams vs All Members Directory vs Role Matrix */}
          <div className="flex items-center gap-1 bg-[#F5F5F2] dark:bg-[#1D2026] p-1 rounded-lg overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-[#FFFFFF] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] shadow-xs'
                  : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>Teams & Members</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#FFFFFF] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] shadow-xs'
                  : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Members Table</span>
              <span className="ml-1 rounded-full bg-[#E8E8E3] dark:bg-[#2B2E36] px-1.5 py-0.2 text-[10px] font-mono">
                {activeMembers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('roles')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'roles'
                  ? 'bg-[#FFFFFF] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] shadow-xs'
                  : 'text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Role Hierarchy</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#365B4B]" />
              <strong>{teams.length}</strong> Teams
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <strong>{activeMembers.length}</strong> Active Users
            </span>
          </div>
        </div>

        {/* Search and Secondary Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#969690]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member name, email, team, or role..."
              className="h-8 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] pl-8 pr-3 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {/* Team Filter */}
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="h-8 w-full sm:w-auto rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-2.5 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="h-8 w-full sm:w-auto rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-2.5 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Engineer (Member)</option>
              <option value="viewer">Stakeholder (Viewer)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── VIEW 1: Grouped by Teams (Teams, Members & Roles Unified) ─── */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {teamGroupedData.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle overflow-hidden"
            >
              {/* Team Banner / Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F8F8F6] dark:bg-[#191C22] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295]">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                        {team.name}
                      </h2>
                      <span className="rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] px-2 py-0.5 text-[10px] font-bold text-[#29483A] dark:text-[#78C295]">
                        {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                      {team.description}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-[#969690] self-start sm:self-auto font-mono">
                  {team.name === 'Platform Engineering' ? 'Lead: Sarah Chen' : 'Lead: Jordan Lee'}
                </div>
              </div>

              {/* Members in this Team */}
              {team.members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] dark:bg-[#16181D] text-[#969690] uppercase text-[10px] font-semibold tracking-wider border-b border-[#E8E8E3] dark:border-[#2B2E36]">
                      <tr>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Role & Privileges</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Joined</th>
                        {isAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E3] dark:divide-[#2B2E36]">
                      {team.members.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-semibold text-[#29483A] dark:text-[#78C295]">
                                {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                                  {m.name}
                                </p>
                                <p className="text-[11px] text-[#969690] font-mono">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold capitalize border ${getRoleBadge(
                                  m.role
                                )}`}
                              >
                                {m.role}
                              </span>
                              <span className="text-[11px] text-[#969690] hidden md:inline">
                                {m.role === 'owner'
                                  ? 'Lead Owner'
                                  : m.role === 'admin'
                                  ? 'Governance Admin'
                                  : m.role === 'member'
                                  ? 'Author & Reviewer'
                                  : 'Auditor & Viewer'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#275B3D] dark:text-[#78C295]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#275B3D]" /> Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#969690] text-[11px]">
                            {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active'}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMember(m)}
                                className="inline-flex items-center gap-1 rounded border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2 py-1 text-[11px] font-medium text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] transition-colors"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#969690]">
                  No members matched this team under current search filters.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── VIEW 2: All Members Table Directory ────────────────────────── */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] dark:bg-[#16181D] text-[#969690] uppercase text-[10px] font-semibold tracking-wider border-b border-[#E8E8E3] dark:border-[#2B2E36]">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Team</th>
                  <th className="py-2.5 px-4">Assigned Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Joined Date</th>
                  {isAdmin && <th className="py-2.5 px-4 text-right">Manage</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E3] dark:divide-[#2B2E36]">
                {filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] transition-colors"
                  >
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
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                        <FolderTree className="h-3 w-3 text-[#365B4B]" />
                        {m.team}
                      </span>
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
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#275B3D] dark:text-[#78C295]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#275B3D]" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#969690] text-[11px]">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active'}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMember(m)}
                          className="inline-flex items-center gap-1 rounded border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2.5 py-1 text-[11px] font-medium text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VIEW 3: Role Hierarchy & Privileges Reference ──────────────── */}
      {viewMode === 'roles' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Owner */}
            <div className="rounded-xl border border-[#F8DCBA] dark:border-[#4D391A] bg-[#FEF7EE]/70 dark:bg-[#2A2318]/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#9A5B13] dark:text-[#F3B367]">Owner</span>
                <span className="rounded-full bg-[#F8DCBA] dark:bg-[#4D391A] px-2 py-0.5 text-[10px] font-bold text-[#9A5B13] dark:text-[#F3B367]">
                  {activeMembers.filter((m) => m.role === 'owner').length} Users
                </span>
              </div>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
                Full workspace authority, global organization configuration, team management, and final ADR approval.
              </p>
              <div className="pt-2 border-t border-[#F8DCBA] dark:border-[#4D391A] text-[11px] text-[#9A5B13] dark:text-[#F3B367] space-y-1">
                <div>✓ Assign workspace roles</div>
                <div>✓ Delete and deprecate ADRs</div>
                <div>✓ Team management & invites</div>
              </div>
            </div>

            {/* Admin */}
            <div className="rounded-xl border border-[#DDD6FE] dark:border-[#4C3872] bg-[#F5F3FF]/70 dark:bg-[#251B38]/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#6D28D9] dark:text-[#C4B5FD]">Admin</span>
                <span className="rounded-full bg-[#DDD6FE] dark:bg-[#4C3872] px-2 py-0.5 text-[10px] font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                  {activeMembers.filter((m) => m.role === 'admin').length} Users
                </span>
              </div>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
                Review registrations, moderate teams, manage decision tags, and configure access permissions.
              </p>
              <div className="pt-2 border-t border-[#DDD6FE] dark:border-[#4C3872] text-[11px] text-[#6D28D9] dark:text-[#C4B5FD] space-y-1">
                <div>✓ Review account requests</div>
                <div>✓ Manage team memberships</div>
                <div>✓ Author & edit all ADRs</div>
              </div>
            </div>

            {/* Member */}
            <div className="rounded-xl border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE]/70 dark:bg-[#192B21]/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#275B3D] dark:text-[#78C295]">Engineer</span>
                <span className="rounded-full bg-[#C6E4D1] dark:bg-[#284936] px-2 py-0.5 text-[10px] font-bold text-[#275B3D] dark:text-[#78C295]">
                  {activeMembers.filter((m) => m.role === 'member').length} Users
                </span>
              </div>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
                Core development contributors. Author architectural records, participate in peer review, and propose ADR status changes.
              </p>
              <div className="pt-2 border-t border-[#C6E4D1] dark:border-[#284936] text-[11px] text-[#275B3D] dark:text-[#78C295] space-y-1">
                <div>✓ Author decision records</div>
                <div>✓ Propose status revisions</div>
                <div>✓ Peer voting & comments</div>
              </div>
            </div>

            {/* Viewer */}
            <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F4F4F0]/70 dark:bg-[#1D2026]/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#6B6B66] dark:text-[#9E9EA8]">Stakeholder</span>
                <span className="rounded-full bg-[#E8E8E3] dark:bg-[#2B2E36] px-2 py-0.5 text-[10px] font-bold text-[#6B6B66] dark:text-[#9E9EA8]">
                  {activeMembers.filter((m) => m.role === 'viewer').length} Users
                </span>
              </div>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
                Transparency and audit role for business sponsors, product stakeholders, and security compliance auditors.
              </p>
              <div className="pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36] text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] space-y-1">
                <div>✓ Search decision vault</div>
                <div>✓ Export ADR documentation</div>
                <div>✓ Audit decision trails</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Edit Member Role & Team (Admin Action) ──────────────── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 sm:p-6 shadow-elevation space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Update Member Role & Team
              </h3>
              <p className="mt-0.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
                Reconfigure assigned privileges and engineering team for {editingMember.name}.
              </p>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                  User
                </label>
                <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-2.5">
                  <p className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">{editingMember.name}</p>
                  <p className="text-[11px] text-[#969690] font-mono truncate">{editingMember.email}</p>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                  Assigned Team
                </label>
                <select
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs focus:border-[#365B4B] focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                  Assigned Role Tier
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs focus:border-[#365B4B] focus:outline-none"
                >
                  <option value="member">Engineer (Member — Can author and edit ADRs)</option>
                  <option value="admin">Admin (Can manage teams and review accounts)</option>
                  <option value="viewer">Stakeholder (Viewer — Read-only transparency)</option>
                  {isOwner && <option value="owner">Owner (Full organization authority)</option>}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
                <button
                  type="button"
                  disabled={isUpdatingMember || isRemovingMember}
                  onClick={() => setEditingMember(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-3.5 py-2 sm:py-1.5 font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingMember || isRemovingMember}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 sm:py-1.5 font-semibold text-white shadow-subtle disabled:opacity-50 transition-colors"
                >
                  {isUpdatingMember && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>

              {/* ── Danger Zone: Remove User (Admin Only) ── */}
              {isAdmin && (
                <div className="pt-3 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
                  {editingMember.role === 'owner' ||
                  editingMember.id === rosterData?.organization?.owner ? (
                    <div className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-2.5 text-[11px] text-[#969690] flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-[#969690] shrink-0" />
                      <span>Primary Organization Owner cannot be removed from the workspace.</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[#F1C8C8] dark:border-[#522525] bg-[#FCF3F3] dark:bg-[#2C1818] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#BC3232] dark:text-[#E88181]">
                          Remove Member
                        </p>
                        <p className="text-[11px] text-[#A34B4B] dark:text-[#D48989] mt-0.5">
                          Revoke access and remove this user from all teams.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isUpdatingMember || isRemovingMember}
                        onClick={handleRemoveMember}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#BC3232] hover:bg-[#9E2828] text-white px-3.5 py-2 sm:py-1.5 font-semibold text-xs shadow-subtle transition-colors disabled:opacity-50 shrink-0"
                      >
                        {isRemovingMember ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span>Remove User</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Direct Invite ────────────────────────────────────────── */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 sm:p-6 shadow-elevation space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Direct Invite Team Member
              </h3>
              <p className="mt-0.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
                Pre-assign an engineering team and role to onboard a new collaborator.
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
                    Assign to Team
                  </label>
                  <select
                    value={inviteTeam}
                    onChange={(e) => setInviteTeam(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] px-3 text-xs focus:border-[#365B4B] focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1C1C1A] dark:text-[#E8EAEF] mb-1">
                    Assign Role Tier
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

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] px-3.5 py-2 sm:py-1.5 font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 sm:py-1.5 font-semibold text-white shadow-subtle transition-colors"
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
