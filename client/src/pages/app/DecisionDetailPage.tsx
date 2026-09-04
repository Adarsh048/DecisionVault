import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  Lock,
  Share2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';
import { usePermissions } from '@/hooks/usePermissions';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DecisionStatus } from '@/lib/constants';

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const permissions = usePermissions();
  const { decisions, updateDecisionStatus, voteDecision } = useDecisionStore();
  const [copied, setCopied] = useState(false);

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
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-2">
              Alternatives Considered
            </h2>
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-lg border border-[#365B4B]/30 bg-[#E7F0EA]/40 dark:bg-[#1F2E25]/30">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#365B4B] dark:text-[#78C295]">
                    01
                  </span>
                  <h3 className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                    Local-First IndexedDB + CRDTs Synchronization (Selected)
                  </h3>
                </div>
                <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
                  Offers complete offline-resilience with instant local response, ensuring engineers can author and review ADRs during transit.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#16181D]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#969690]">
                    02
                  </span>
                  <h3 className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                    Pure Client-Server REST with WebSocket Push
                  </h3>
                </div>
                <p className="mt-1 text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed">
                  Simple implementation but introduces write blocking when disconnected and risks draft loss.
                </p>
              </div>
            </div>
          </section>

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

            {/* Peer Consensus Endorsements */}
            <div className="border-t border-[#E8E8E3] dark:border-[#2B2E36] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-2">
                Peer Consensus
              </p>
              <button
                type="button"
                onClick={() => voteDecision(decision.id, 'up')}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  decision.votes.userVote === 'up'
                    ? 'border-[#365B4B] bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                    : 'border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{decision.votes.userVote === 'up' ? 'Endorsed' : 'Endorse proposal'}</span>
                </span>
                <span className="font-mono text-xs">{decision.votes.up}</span>
              </button>
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
