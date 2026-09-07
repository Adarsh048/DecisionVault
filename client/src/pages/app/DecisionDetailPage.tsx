import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Lock,
  Share2,
  Check,
  ChevronRight,
  Users,
  Clock,
} from 'lucide-react';
import { useDecisionStore, type VoterRecord } from '@/store/decisionStore';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DecisionStatus } from '@/lib/constants';

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const permissions = usePermissions();
  const authUser = useAuthStore((s) => s.user);
  const { decisions, updateDecisionStatus, voteDecision } = useDecisionStore();
  const [copied, setCopied] = useState(false);
  const [voterFilter, setVoterFilter] = useState<'all' | 'up' | 'down'>('all');

  const decision = decisions.find((d) => d.id === id);

  if (!decision) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-12 text-center shadow-subtle">
        <h2 className="text-lg font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
          Decision Not Found
        </h2>
        <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
          The requested architecture decision record does not exist or has been removed.
        </p>
        <Link
          to="/app/decisions"
          className="mt-4 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          Return to Decisions Explorer
        </Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const relatedDecisions = decisions
    .filter((d) => d.id !== decision.id)
    .slice(0, 3);

  // Derive voter list & current user's active stance
  const voters: VoterRecord[] = Array.isArray(decision.votes?.voters)
    ? decision.votes.voters
    : [];

  const currentUserVoter = voters.find(
    (v) => (v.userId && v.userId === authUser?._id) || (v.userEmail && v.userEmail === authUser?.email)
  );
  const activeUserChoice: 'up' | 'down' | undefined = currentUserVoter
    ? currentUserVoter.option
    : decision.votes?.userVote;

  const upVotesCount = decision.votes?.up ?? voters.filter((v) => v.option === 'up').length;
  const downVotesCount = decision.votes?.down ?? voters.filter((v) => v.option === 'down').length;
  const totalVotesCount = voters.length > 0 ? voters.length : (upVotesCount + downVotesCount);

  const filteredVoters = voters.filter((v) => {
    if (voterFilter === 'up') return v.option === 'up';
    if (voterFilter === 'down') return v.option === 'down';
    return true;
  });

  const approvalRate = totalVotesCount > 0
    ? Math.round((upVotesCount / totalVotesCount) * 100)
    : 100;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ─── Breadcrumb & Navigation Bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6B66] dark:text-[#9E9EA8] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-4">
        <nav className="flex items-center gap-1.5 font-medium">
          <Link
            to="/app/decisions"
            className="hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
          >
            Decisions
          </Link>
          <ChevronRight className="h-3 w-3 text-[#969690]" />
          <span>{decision.team}</span>
          <ChevronRight className="h-3 w-3 text-[#969690]" />
          <span className="font-mono text-[#1C1C1A] dark:text-[#E8EAEF]">
            ADR-{String(decision.number).padStart(3, '0')}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2.5 py-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] hover:bg-[#F5F5F2] transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-[#275B3D]" /> : <Share2 className="h-3 w-3" />}
            <span>{copied ? 'Link copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* ─── Document Title & Core Metadata ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-semibold text-[#969690] px-2 py-0.5 rounded bg-[#F5F5F2] dark:bg-[#1D2026] border border-[#E8E8E3] dark:border-[#2B2E36]">
            ADR-{String(decision.number).padStart(3, '0')}
          </span>
          <StatusBadge status={decision.status} size="md" />
          <span className="text-xs text-[#969690]">
            Updated on{' '}
            {new Date(decision.updatedAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-4xl leading-tight">
          {decision.title}
        </h1>
      </div>

      {/* ─── Editorial Layout: Document (Left) + Sticky Sidebar (Right) ───── */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main Document Body (2 Columns) */}
        <div className="lg:col-span-2 space-y-8 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 md:p-8 shadow-subtle">
          {/* Section 1: Problem & Context */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-2">
              Problem & Context
            </h2>
            <p className="text-sm leading-relaxed text-[#1C1C1A] dark:text-[#E8EAEF] whitespace-pre-line font-normal">
              {decision.context}
            </p>
          </section>

          {/* Section 2: Alternatives Considered */}
          {/* Section 2: Alternatives Considered (Only displayed if authored) */}
          {decision.alternatives && decision.alternatives.trim() && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-2">
                Alternatives Considered
              </h2>
              <div className="p-3.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#16181D]">
                <p className="text-sm leading-relaxed text-[#6B6B66] dark:text-[#9E9EA8] whitespace-pre-line">
                  {decision.alternatives}
                </p>
              </div>
            </section>
          )}

          {/* Section 3: Final Decision */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-2">
              Final Decision
            </h2>
            <div className="pl-4 border-l-2 border-[#365B4B] py-1">
              <p className="text-sm leading-relaxed text-[#1C1C1A] dark:text-[#E8EAEF] font-medium">
                {decision.decision}
              </p>
            </div>
          </section>

          {/* Section 4: Consequences & Trade-offs */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-2">
              Consequences & Trade-offs
            </h2>
            <p className="text-sm leading-relaxed text-[#6B6B66] dark:text-[#9E9EA8] whitespace-pre-line">
              {decision.consequences}
            </p>
          </section>

          {/* Section 5: Peer Consensus & Reviewer Stances */}
          <section className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#365B4B] dark:text-[#78C295]" />
                <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                  Peer Consensus & Reviewer Stances
                </h2>
              </div>
              <span className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8]">
                {approvalRate}% Endorsement ({upVotesCount} of {totalVotesCount} reviewers)
              </span>
            </div>

            {/* Voting Options Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026]">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-[#969690] uppercase tracking-wider">Total Stances</p>
                  <p className="text-lg font-bold text-[#1C1C1A] dark:text-[#E8EAEF] font-mono">{totalVotesCount}</p>
                </div>
                <Users className="h-4 w-4 text-[#969690]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE] dark:bg-[#192B21]">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-[#275B3D] dark:text-[#78C295] uppercase tracking-wider">Endorsed (Up)</p>
                  <p className="text-lg font-bold text-[#275B3D] dark:text-[#78C295] font-mono">{upVotesCount}</p>
                </div>
                <ThumbsUp className="h-4 w-4 text-[#275B3D] dark:text-[#78C295]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#F8D7DA] dark:border-[#4B2226] bg-[#FDF2F2] dark:bg-[#2B1B1D]">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-[#9E2A2B] dark:text-[#E07A7C] uppercase tracking-wider">Opposed (Down)</p>
                  <p className="text-lg font-bold text-[#9E2A2B] dark:text-[#E07A7C] font-mono">{downVotesCount}</p>
                </div>
                <ThumbsDown className="h-4 w-4 text-[#9E2A2B] dark:text-[#E07A7C]" />
              </div>
            </div>

            {/* Filter Tabs for Reviewers */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setVoterFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  voterFilter === 'all'
                    ? 'bg-[#1C1C1A] text-white dark:bg-[#E8EAEF] dark:text-[#16181D]'
                    : 'bg-[#F5F5F2] dark:bg-[#1D2026] text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
                }`}
              >
                All Reviewers ({voters.length})
              </button>
              <button
                type="button"
                onClick={() => setVoterFilter('up')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  voterFilter === 'up'
                    ? 'bg-[#275B3D] text-white dark:bg-[#78C295] dark:text-[#192B21]'
                    : 'bg-[#F5F5F2] dark:bg-[#1D2026] text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
                }`}
              >
                <ThumbsUp className="h-3 w-3" />
                <span>Endorsed ({upVotesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setVoterFilter('down')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  voterFilter === 'down'
                    ? 'bg-[#9E2A2B] text-white dark:bg-[#E07A7C] dark:text-[#2B1B1D]'
                    : 'bg-[#F5F5F2] dark:bg-[#1D2026] text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A]'
                }`}
              >
                <ThumbsDown className="h-3 w-3" />
                <span>Opposed ({downVotesCount})</span>
              </button>
            </div>

            {/* List of Users with their Options */}
            {filteredVoters.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#16181D] space-y-1">
                <p className="text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {voterFilter === 'all'
                    ? 'No reviewer stances recorded yet.'
                    : `No reviewers have marked this as ${voterFilter === 'up' ? 'Endorsed' : 'Opposed'}.`}
                </p>
                <p className="text-[11px] text-[#969690]">
                  Use the Endorse or Oppose buttons to submit your peer consensus stance.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E8E3] dark:divide-[#2B2E36] rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] overflow-hidden">
                {filteredVoters.map((voter, index) => {
                  const isCurrentUser =
                    (voter.userId && voter.userId === authUser?._id) ||
                    (voter.userEmail && voter.userEmail === authUser?.email);

                  return (
                    <div
                      key={`${voter.userId || voter.userEmail}-${index}`}
                      className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] dark:bg-[#16181D] hover:bg-[#FAFAF8] dark:hover:bg-[#1D2026] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            voter.option === 'up'
                              ? 'bg-[#EBF5EE] dark:bg-[#192B21] text-[#275B3D] dark:text-[#78C295]'
                              : 'bg-[#FDF2F2] dark:bg-[#2B1B1D] text-[#9E2A2B] dark:text-[#E07A7C]'
                          }`}
                        >
                          {voter.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] truncate">
                              {voter.userName}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-[#365B4B] dark:text-[#78C295] bg-[#E7F0EA] dark:bg-[#1F2E25] px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                            <span className="text-[10px] text-[#969690] px-1.5 py-0.5 rounded bg-[#F5F5F2] dark:bg-[#20222B] border border-[#E8E8E3] dark:border-[#2B2E36]">
                              {voter.userRole || 'Engineer'}
                            </span>
                          </div>
                          {voter.userEmail && (
                            <p className="text-[11px] text-[#969690] truncate">{voter.userEmail}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {voter.option === 'up' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EBF5EE] dark:bg-[#192B21] text-[#275B3D] dark:text-[#78C295] border border-[#C6E4D1] dark:border-[#284936]">
                            <ThumbsUp className="h-3 w-3" />
                            <span>Endorsed (Upvote)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF2F2] dark:bg-[#2B1B1D] text-[#9E2A2B] dark:text-[#E07A7C] border border-[#F8D7DA] dark:border-[#4B2226]">
                            <ThumbsDown className="h-3 w-3" />
                            <span>Opposed (Downvote)</span>
                          </span>
                        )}

                        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#969690]">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(voter.votedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sticky Contextual Right Sidebar (1 Column) */}
        <aside className="space-y-6">
          <div className="sticky top-6 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle space-y-5 text-xs">
            {/* Decision Status Control */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-2">
                Status Governance
              </p>
              {permissions.canEditDecisions ? (
                <div className="space-y-2">
                  <select
                    value={decision.status}
                    onChange={(e) => updateDecisionStatus(decision.id, e.target.value as DecisionStatus)}
                    className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-1.5 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none capitalize"
                  >
                    <option value="proposed">Proposed</option>
                    <option value="accepted">Accepted</option>
                    <option value="draft">Draft</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                  <p className="text-[11px] text-[#969690]">
                    Status changes record an entry in the organization audit log.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#969690] bg-[#F5F5F2] dark:bg-[#1D2026] p-2 rounded-md">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Stakeholders have read-only access.</span>
                </div>
              )}
            </div>

            {/* Peer Consensus Endorsements & Objections */}
            <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690]">
                  Peer Consensus
                </p>
                <span className="text-[10px] font-medium text-[#969690]">
                  {voters.length} {voters.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {/* Voting buttons: Endorse & Oppose */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => voteDecision(decision.id, 'up')}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    activeUserChoice === 'up'
                      ? 'border-[#275B3D] bg-[#EBF5EE] text-[#275B3D] dark:border-[#284936] dark:bg-[#192B21] dark:text-[#78C295]'
                      : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B]'
                  }`}
                  title={activeUserChoice === 'up' ? 'Click to revoke stance' : 'Endorse this proposal'}
                >
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{activeUserChoice === 'up' ? 'Endorsed' : 'Endorse'}</span>
                  </span>
                  <span className="font-mono text-xs">{upVotesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => voteDecision(decision.id, 'down')}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    activeUserChoice === 'down'
                      ? 'border-[#9E2A2B] bg-[#FDF2F2] text-[#9E2A2B] dark:border-[#4B2226] dark:bg-[#2B1B1D] dark:text-[#E07A7C]'
                      : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B]'
                  }`}
                  title={activeUserChoice === 'down' ? 'Click to revoke stance' : 'Oppose this proposal'}
                >
                  <span className="flex items-center gap-1.5">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    <span>{activeUserChoice === 'down' ? 'Opposed' : 'Oppose'}</span>
                  </span>
                  <span className="font-mono text-xs">{downVotesCount}</span>
                </button>
              </div>

              {activeUserChoice && (
                <div className="flex items-center justify-between rounded-md bg-[#F5F5F2] dark:bg-[#1D2026] px-2.5 py-1.5 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
                  <span>Your stance: <strong className="text-[#1C1C1A] dark:text-[#E8EAEF]">{activeUserChoice === 'up' ? 'Endorsed (Up)' : 'Opposed (Down)'}</strong></span>
                  <button
                    type="button"
                    onClick={() => voteDecision(decision.id, activeUserChoice)}
                    className="text-[10px] text-[#365B4B] dark:text-[#78C295] hover:underline"
                  >
                    Revoke
                  </button>
                </div>
              )}

              {/* Reviewers Quick List in Sidebar */}
              {voters.length > 0 && (
                <div className="pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36] space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#969690]">
                    Reviewer Breakdown ({voters.length})
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {voters.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1 text-[11px] text-[#1C1C1A] dark:text-[#E8EAEF]"
                      >
                        <span className="truncate pr-2">{v.userName}</span>
                        {v.option === 'up' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-1.5 py-0.5 rounded shrink-0">
                            <ThumbsUp className="h-2.5 w-2.5" />
                            <span>Up</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#9E2A2B] dark:text-[#E07A7C] bg-[#FDF2F2] dark:bg-[#2B1B1D] px-1.5 py-0.5 rounded shrink-0">
                            <ThumbsDown className="h-2.5 w-2.5" />
                            <span>Down</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Decision Owners & Contributors */}
            <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-4 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-1.5">
                  Author / Owner
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
                    {decision.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                      {decision.author.name}
                    </p>
                    <p className="text-[10px] text-[#969690]">{decision.author.role}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-1.5">
                  Team
                </p>
                <p className="text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {decision.team}
                </p>
              </div>
            </div>

            {/* Record Timestamps */}
            <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-4 space-y-2 text-[#6B6B66] dark:text-[#9E9EA8]">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {new Date(decision.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last updated</span>
                <span className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {new Date(decision.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-2">
                Classification Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {decision.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-[#F5F5F2] dark:bg-[#20222B] px-2 py-0.5 text-[10px] font-medium text-[#6B6B66] dark:text-[#9E9EA8] border border-[#E8E8E3] dark:border-[#2B2E36]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Related Decisions */}
            {relatedDecisions.length > 0 && (
              <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-2">
                  Related Records
                </p>
                <div className="space-y-1.5">
                  {relatedDecisions.map((rd) => (
                    <Link
                      key={rd.id}
                      to={`/app/decisions/${rd.id}`}
                      className="block truncate text-xs text-[#365B4B] dark:text-[#78C295] hover:underline"
                    >
                      • {rd.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
