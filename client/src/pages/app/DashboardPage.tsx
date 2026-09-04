import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { decisions } = useDecisionStore();
  const permissions = usePermissions();
  const approvals = useUserApprovalStore((state) => state.approvals);

  useEffect(() => {
    useUserApprovalStore.getState().fetchFromApi();
  }, []);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  const total = decisions.length;
  const accepted = decisions.filter((d) => d.status === 'accepted').length;
  const proposed = decisions.filter((d) => d.status === 'proposed').length;
  const draft = decisions.filter((d) => d.status === 'draft').length;

  const recent = decisions.slice(0, 5);

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
            Here's what's happening across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {permissions.canCreateDecisions && (
            <button
              type="button"
              onClick={() => navigate('/app/decisions/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9A5B13] hover:bg-[#7D480E] px-3 py-1.5 text-xs font-semibold text-white transition-colors shrink-0"
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

      {/* ─── Primary Statistics (Horizontal Summary) ────────────────────────── */}
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle">
        <div className="grid grid-cols-2 gap-4 divide-y divide-[#E8E8E3] dark:divide-[#2B2E36] sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {/* Metric 1 */}
          <div className="px-3 pt-2 sm:pt-0 sm:first:pl-0">
            <p className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF]">
              {total}
            </p>
            <p className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Total Decisions
            </p>
            <p className="text-[11px] text-[#969690] mt-1">Across all workspace teams</p>
          </div>

          {/* Metric 2 */}
          <div className="px-3 pt-4 sm:pt-0">
            <p className="text-2xl font-semibold tracking-tight text-[#275B3D] dark:text-[#78C295]">
              {accepted}
            </p>
            <p className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Accepted
            </p>
            <p className="text-[11px] text-[#969690] mt-1">
              {total ? Math.round((accepted / total) * 100) : 0}% of all records
            </p>
          </div>

          {/* Metric 3 */}
          <div className="px-3 pt-4 sm:pt-0">
            <p className="text-2xl font-semibold tracking-tight text-[#9A5B13] dark:text-[#F3B367]">
              {proposed}
            </p>
            <p className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Under Review
            </p>
            <p className="text-[11px] text-[#969690] mt-1">Pending peer consensus</p>
          </div>

          {/* Metric 4 */}
          <div className="px-3 pt-4 sm:pt-0">
            <p className="text-2xl font-semibold tracking-tight text-[#6B6B66] dark:text-[#A0A09B]">
              {draft}
            </p>
            <p className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
              Drafts
            </p>
            <p className="text-[11px] text-[#969690] mt-1">Work in progress</p>
          </div>
        </div>
      </div>

      {/* ─── Two-Column Section: Decisions List & Activity Timeline ─────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (2/3): Recent Decisions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Recent Decisions
              </h2>
              <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
                Latest architectural decisions recorded across engineering groups
              </p>
            </div>
            <Link
              to="/app/decisions"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#365B4B] dark:text-[#78C295] hover:underline"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] divide-y divide-[#E8E8E3] dark:divide-[#2B2E36] shadow-subtle overflow-hidden">
            {recent.map((d) => (
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

          <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#E8E8E3] dark:before:bg-[#2B2E36]">
              {/* Timeline Item 1 */}
              <div className="relative">
                <span className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-[#365B4B] ring-4 ring-[#FFFFFF] dark:ring-[#16181D]" />
                <p className="text-[11px] font-semibold text-[#969690] uppercase tracking-wider">
                  Today · 10:32 AM
                </p>
                <p className="text-xs text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                  <span className="font-semibold">Sarah Chen</span> accepted{' '}
                  <span className="text-[#365B4B] dark:text-[#78C295]">
                    "Adopt Hybrid CRDTs & IndexedDB"
                  </span>
                </p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative">
                <span className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-[#9A5B13] ring-4 ring-[#FFFFFF] dark:ring-[#16181D]" />
                <p className="text-[11px] font-semibold text-[#969690] uppercase tracking-wider">
                  Today · 9:15 AM
                </p>
                <p className="text-xs text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                  <span className="font-semibold">Alex Rivera</span> proposed revisions to{' '}
                  <span className="text-[#365B4B] dark:text-[#78C295]">
                    "Migrate Service Messaging to WebSockets"
                  </span>
                </p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative">
                <span className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-[#969690] ring-4 ring-[#FFFFFF] dark:ring-[#16181D]" />
                <p className="text-[11px] font-semibold text-[#969690] uppercase tracking-wider">
                  Yesterday
                </p>
                <p className="text-xs text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                  <span className="font-semibold">Jordan Lee</span> cast an approval vote on{' '}
                  <span className="text-[#365B4B] dark:text-[#78C295]">
                    "Standardize ADR Governance Lifecycle"
                  </span>
                </p>
              </div>

              {/* Timeline Item 4 */}
              <div className="relative">
                <span className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-[#969690] ring-4 ring-[#FFFFFF] dark:ring-[#16181D]" />
                <p className="text-[11px] font-semibold text-[#969690] uppercase tracking-wider">
                  Aug 28
                </p>
                <p className="text-xs text-[#1C1C1A] dark:text-[#E8EAEF] mt-0.5">
                  <span className="font-semibold">Workspace</span> created in Acme Corporation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
