import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Clock,
  ChevronRight,
  X,
  FileText,
  Crown,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { decisions } = useDecisionStore();
  const permissions = usePermissions();
  const approvals = useUserApprovalStore((state) => state.approvals);
  const notifications = useNotificationStore((state) => state.notifications);
  const openProposalDialog = useNotificationStore((state) => state.openProposalDialog);

  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'accepted' | 'proposed' | 'draft' | 'deprecated'>('all');

  useEffect(() => {
    useUserApprovalStore.getState().fetchFromApi();
  }, []);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  const activeOwnerProposal = notifications.find(
    (n) =>
      (n.isOwnerProposal || n.author?.role?.toLowerCase().includes('owner')) &&
      !n.read &&
      n.author?.email?.toLowerCase() !== user?.email?.toLowerCase() &&
      decisions.some((d) => d.id === n.decisionId) &&
      !['dec-1', 'dec-2', 'dec-3', 'dec-4', 'dec-5'].includes(n.decisionId || '') &&
      !n.id.includes('-sim-') &&
      !n.id.includes('init')
  );

  const total = decisions.length;
  const accepted = decisions.filter((d) => d.status === 'accepted').length;
  const proposed = decisions.filter((d) => d.status === 'proposed').length;
  const draft = decisions.filter((d) => d.status === 'draft').length;
  const deprecated = decisions.filter((d) => d.status === 'deprecated').length;

  const displayDecisions = useMemo(() => {
    if (activeStatusFilter === 'all') return decisions;
    return decisions.filter((d) => d.status === activeStatusFilter);
  }, [decisions, activeStatusFilter]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="space-y-8">
      {/* ─── Dashboard Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl">
            Good morning, {firstName}
          </h1>
          <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
            Here's what's happening across your workspace. Click any status card to filter the decision list.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {permissions.canCreateDecisions && (
            <button
              type="button"
              onClick={() => navigate('/app/decisions/new')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Decision</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Owner Notification Notice (If new users awaiting role decision) ─ */}
      {permissions.isOwner && pendingApprovals.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#F8DCBA] dark:border-[#5C4524] bg-[#FEF7EE] dark:bg-[#2A2318] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8DCBA]/60 dark:bg-[#5C4524]/60 text-[#9A5B13] dark:text-[#F3B367]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                {pendingApprovals.length} new account{pendingApprovals.length > 1 ? 's' : ''} awaiting role assignment
              </h3>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
                As the Organization Owner, review and assign engineering privileges (Member, Admin, or Viewer).
              </p>
            </div>
          </div>
          <Link
            to="/app/teams"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#9A5B13] hover:bg-[#7D480E] px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white transition-colors shrink-0"
          >
            <span>Review Requests</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ─── Pending User Notice (If caller is newly registered) ────────────── */}
      {permissions.isPendingApproval && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-4 text-xs">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Account Registered · Awaiting Role Assignment
            </h3>
            <p className="mt-0.5 text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
              Your profile is in review. Sarah Chen (Owner) has been notified to assign your role. You currently have read-only permissions to explore existing architectural decisions.
            </p>
          </div>
        </div>
      )}

      {/* ─── Active Owner Proposal Review Notice (For Engineers & Viewers) ─ */}
      {activeOwnerProposal && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#F8DCBA] dark:border-[#5C4524] bg-gradient-to-r from-[#FEF7EE] via-[#FDF5E8] to-[#FFFFFF] dark:from-[#241F16] dark:via-[#1F1C18] dark:to-[#16181D] p-4 sm:flex-row sm:items-center sm:justify-between shadow-subtle animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF7EE] dark:bg-[#2F2417] text-[#D97706] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524] shadow-xs">
              <Crown className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-[#FEF7EE] dark:bg-[#2A2318] px-1.5 py-0.2 text-[10px] font-bold text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
                  Owner Proposal
                </span>
                <span className="text-[11px] font-mono text-[#29483A] dark:text-[#78C295]">
                  ADR-{String(activeOwnerProposal.decisionNumber || 1).padStart(3, '0')}
                </span>
                <span className="text-[11px] text-[#969690]">
                  by {activeOwnerProposal.author?.name || 'Sarah Chen'}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1C1C1A] dark:text-[#E8EAEF] truncate mt-0.5">
                {activeOwnerProposal.decisionTitle || activeOwnerProposal.title}
              </h3>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] truncate mt-0.5">
                {permissions.isMember
                  ? '⚡ Engineer review requested: Cast your vote on this proposed architectural change.'
                  : '👁️ Open for stakeholder review and architectural alignment.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => openProposalDialog(activeOwnerProposal)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-subtle transition-colors"
            >
              <span>Review Proposal</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Primary Statistics (Interactive Filtering Cards) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Decisions */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter('all')}
          className={`text-left p-4 rounded-xl border transition-all relative group cursor-pointer ${
            activeStatusFilter === 'all'
              ? 'border-[#365B4B] dark:border-[#78C295] bg-[#F5F8F6] dark:bg-[#192620] ring-2 ring-[#365B4B]/20 shadow-sm'
              : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] hover:border-[#365B4B]/40 hover:bg-[#FAFBF9] dark:hover:bg-[#1A1D23]'
          }`}
          title="Click to view all decisions"
        >
          <p className="text-2xl font-bold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
            {total}
          </p>
          <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] mt-1">
            Total Decisions
          </p>
          <p className="text-[11px] text-[#969690] mt-0.5">
            Across all teams
          </p>
        </button>

        {/* Metric 2: Accepted */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'accepted' ? 'all' : 'accepted')}
          className={`text-left p-4 rounded-xl border transition-all relative group cursor-pointer ${
            activeStatusFilter === 'accepted'
              ? 'border-[#275B3D] dark:border-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] ring-2 ring-[#275B3D]/30 shadow-sm'
              : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] hover:border-[#275B3D]/40 hover:bg-[#FAFBF9] dark:hover:bg-[#1A1D23]'
          }`}
          title="Click to filter by accepted decisions"
        >
          <p className="text-2xl font-bold tracking-tight text-[#275B3D] dark:text-[#78C295]">
            {accepted}
          </p>
          <p className="text-xs font-semibold text-[#275B3D] dark:text-[#78C295] mt-1">
            Accepted
          </p>
          <p className="text-[11px] text-[#969690] mt-0.5">
            {total ? Math.round((accepted / total) * 100) : 0}% of all records
          </p>
        </button>

        {/* Metric 3: Under Review (Proposed) */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'proposed' ? 'all' : 'proposed')}
          className={`text-left p-4 rounded-xl border transition-all relative group cursor-pointer ${
            activeStatusFilter === 'proposed'
              ? 'border-[#D97706] dark:border-[#F3B367] bg-[#FEF7EE] dark:bg-[#2A2318] ring-2 ring-[#D97706]/30 shadow-sm'
              : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] hover:border-[#D97706]/40 hover:bg-[#FAFBF9] dark:hover:bg-[#1A1D23]'
          }`}
          title="Click to filter by under review decisions"
        >
          <p className="text-2xl font-bold tracking-tight text-[#9A5B13] dark:text-[#F3B367]">
            {proposed}
          </p>
          <p className="text-xs font-semibold text-[#9A5B13] dark:text-[#F3B367] mt-1">
            Under Review
          </p>
          <p className="text-[11px] text-[#969690] mt-0.5">
            Pending consensus
          </p>
        </button>

        {/* Metric 4: Drafts */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'draft' ? 'all' : 'draft')}
          className={`text-left p-4 rounded-xl border transition-all relative group cursor-pointer ${
            activeStatusFilter === 'draft'
              ? 'border-[#6B6B66] dark:border-[#A0A09B] bg-[#F5F5F2] dark:bg-[#20222B] ring-2 ring-[#6B6B66]/30 shadow-sm'
              : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] hover:border-[#6B6B66]/40 hover:bg-[#FAFBF9] dark:hover:bg-[#1A1D23]'
          }`}
          title="Click to filter by draft decisions"
        >
          <p className="text-2xl font-bold tracking-tight text-[#6B6B66] dark:text-[#A0A09B]">
            {draft}
          </p>
          <p className="text-xs font-semibold text-[#6B6B66] dark:text-[#A0A09B] mt-1">
            Drafts
          </p>
          <p className="text-[11px] text-[#969690] mt-0.5">
            Work in progress
          </p>
        </button>

        {/* Metric 5: Deprecated */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'deprecated' ? 'all' : 'deprecated')}
          className={`text-left p-4 rounded-xl border transition-all relative group cursor-pointer col-span-2 sm:col-span-1 ${
            activeStatusFilter === 'deprecated'
              ? 'border-[#9B2C2C] dark:border-[#F08C8C] bg-[#FDF2F2] dark:bg-[#2F1D1D] ring-2 ring-[#9B2C2C]/30 shadow-sm'
              : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] hover:border-[#9B2C2C]/40 hover:bg-[#FAFBF9] dark:hover:bg-[#1A1D23]'
          }`}
          title="Click to filter by deprecated decisions"
        >
          <p className="text-2xl font-bold tracking-tight text-[#9B2C2C] dark:text-[#F08C8C]">
            {deprecated}
          </p>
          <p className="text-xs font-semibold text-[#9B2C2C] dark:text-[#F08C8C] mt-1">
            Deprecated
          </p>
          <p className="text-[11px] text-[#969690] mt-0.5">
            Superseded records
          </p>
        </button>
      </div>

      {/* ─── Two-Column Section: Decisions List & Activity Timeline ─────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (2/3): Filtered Decisions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {activeStatusFilter === 'all' && 'All Workspace Decisions'}
                  {activeStatusFilter === 'accepted' && 'Accepted Decisions'}
                  {activeStatusFilter === 'proposed' && 'Decisions Under Review'}
                  {activeStatusFilter === 'draft' && 'Draft Decisions'}
                  {activeStatusFilter === 'deprecated' && 'Deprecated Decisions'}
                </h2>
                <span className="rounded-full bg-[#EAEAE6] dark:bg-[#2B2E36] px-2 py-0.5 text-xs font-semibold text-[#4A4A45] dark:text-[#E8EAEF]">
                  {displayDecisions.length}
                </span>
              </div>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                {activeStatusFilter === 'all'
                  ? 'All architectural decisions recorded across engineering groups'
                  : `Showing only ${activeStatusFilter === 'proposed' ? 'under review' : activeStatusFilter} architectural records`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeStatusFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveStatusFilter('all')}
                  className="inline-flex items-center gap-1 rounded-md border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2.5 py-1 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
                  title="Clear status filter"
                >
                  <X className="h-3 w-3" />
                  <span>Show all</span>
                </button>
              )}

              <Link
                to={activeStatusFilter === 'all' ? '/app/decisions' : `/app/decisions?status=${activeStatusFilter}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#365B4B] dark:text-[#78C295] hover:underline"
              >
                <span>Full Explorer</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {displayDecisions.length === 0 ? (
            <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-8 text-center shadow-subtle">
              <FileText className="h-8 w-8 mx-auto mb-2 text-[#969690] opacity-40" />
              {decisions.length === 0 ? (
                <>
                  <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                    No decisions created yet
                  </p>
                  <p className="text-[11px] text-[#969690] mt-1 mb-4 max-w-sm mx-auto">
                    Start recording your architecture by proposing your first architectural decision record.
                  </p>
                  {permissions.canCreateDecisions && (
                    <button
                      type="button"
                      onClick={() => navigate('/app/decisions/new')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-subtle transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Propose First Decision</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                    No {activeStatusFilter === 'proposed' ? 'under review' : activeStatusFilter} decisions found
                  </p>
                  <p className="text-[11px] text-[#969690] mt-1 mb-3">
                    There are currently no decisions matching this status in your workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveStatusFilter('all')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#365B4B] dark:text-[#78C295] hover:underline"
                  >
                    <span>Reset filter to view all decisions</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] divide-y divide-[#E8E8E3] dark:divide-[#2B2E36] shadow-subtle overflow-hidden">
              {displayDecisions.map((d) => (
                <Link
                  key={d.id}
                  to={`/app/decisions/${d.id}`}
                  className="group flex flex-col gap-2 p-4 transition-colors hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#969690]">
                        ADR-{String(d.number).padStart(3, '0')}
                      </span>
                      <span className="truncate text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] group-hover:text-[#365B4B] dark:group-hover:text-[#78C295] transition-colors">
                        {d.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
                      <span>{d.team}</span>
                      <span>·</span>
                      <span>By {d.author.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={d.status} size="sm" />
                    <span className="text-[11px] text-[#969690] hidden md:inline">
                      {new Date(d.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#969690] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1/3): Activity Timeline ───────────────────────────── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              Activity Timeline
            </h2>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
              Recent consensus and documentation updates
            </p>
          </div>

          {decisions.length === 0 ? (
            <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle text-center">
              <p className="text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">No recent activity yet</p>
              <p className="text-[11px] text-[#969690] mt-1">Activity will appear as you propose decisions and cast votes.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#E8E8E3] dark:before:bg-[#2B2E36]">
                {decisions.slice(0, 4).map((d) => (
                  <div key={d.id} className="relative">
                    <span
                      className={`absolute -left-6 top-1 h-2 w-2 rounded-full ring-4 ring-[#FFFFFF] dark:ring-[#16181D] ${
                        d.status === 'accepted' ? 'bg-[#365B4B]' : 'bg-[#9A5B13]'
                      }`}
                    />
                    <p className="text-[11px] font-semibold text-[#969690] uppercase tracking-wider">
                      {new Date(d.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                      <span className="font-semibold">{d.author.name}</span>{' '}
                      {d.status === 'accepted' ? 'accepted' : 'proposed'}{' '}
                      <Link to={`/app/decisions/${d.id}`} className="text-[#365B4B] dark:text-[#78C295] hover:underline">
                        "{d.title}"
                      </Link>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
