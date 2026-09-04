import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronRight,
  FileQuestion,
  Lock,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';
import { usePermissions } from '@/hooks/usePermissions';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function DecisionExplorerPage() {
  const navigate = useNavigate();
  const { decisions } = useDecisionStore();
  const permissions = usePermissions();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'votes'>('newest');

  // Extract unique teams
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    decisions.forEach((d) => {
      if (d.team) teams.add(d.team);
    });
    return Array.from(teams);
  }, [decisions]);

  const filtered = useMemo(() => {
    return decisions
      .filter((d) => {
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchesTeam = teamFilter === 'all' || d.team === teamFilter;
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          d.title.toLowerCase().includes(query) ||
          d.decision.toLowerCase().includes(query) ||
          d.tags.some((t) => t.toLowerCase().includes(query)) ||
          d.author.name.toLowerCase().includes(query);

        return matchesStatus && matchesTeam && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        if (sortBy === 'votes') {
          return b.votes.up - a.votes.up;
        }
        return 0;
      });
  }, [decisions, search, statusFilter, teamFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl">
            Decisions
          </h1>
          <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
            Knowledge database of all architecture and technical evaluations.
          </p>
        </div>

        {permissions.canCreateDecisions ? (
          <button
            type="button"
            onClick={() => navigate('/app/decisions/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-4 py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Decision</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-1.5 text-xs text-[#969690]">
            <Lock className="h-3.5 w-3.5" />
            <span>Stakeholder (Read-Only)</span>
          </div>
        )}
      </div>

      {/* ─── Search & Filters Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#969690]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, rationale, or tag..."
            className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] pl-9 pr-3 py-1.5 text-xs text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2.5 py-1.5 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] focus:border-[#365B4B] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="proposed">Proposed</option>
            <option value="draft">Draft</option>
            <option value="deprecated">Deprecated</option>
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2.5 py-1.5 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] focus:border-[#365B4B] focus:outline-none"
          >
            <option value="all">All Teams</option>
            {availableTeams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-2.5 py-1.5 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] focus:border-[#365B4B] focus:outline-none"
          >
            <option value="newest">Recently Updated</option>
            <option value="oldest">Oldest First</option>
            <option value="votes">Highest Consensus</option>
          </select>
        </div>
      </div>

      {/* ─── List / Table Hybrid View ─────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-[#E8E8E3] dark:divide-[#2B2E36]">
            {filtered.map((d) => (
              <Link
                key={d.id}
                to={`/app/decisions/${d.id}`}
                className="group flex flex-col gap-3 p-4 transition-colors hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] md:flex-row md:items-center md:justify-between"
              >
                {/* Left info */}
                <div className="space-y-1.5 min-w-0 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[#969690] shrink-0">
                      ADR-{String(d.number).padStart(3, '0')}
                    </span>
                    <span className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] group-hover:text-[#365B4B] dark:group-hover:text-[#78C295] transition-colors">
                      {d.title}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] line-clamp-1">
                    {d.decision || d.context}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {d.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#F5F5F2] dark:bg-[#20222B] px-1.5 py-0.5 text-[10px] font-medium text-[#6B6B66] dark:text-[#9E9EA8] border border-[#E8E8E3] dark:border-[#2B2E36]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right metadata */}
                <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t border-[#E8E8E3]/60 dark:border-[#2B2E36]/60 md:border-t-0">
                  <StatusBadge status={d.status} size="sm" />

                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                      {d.team}
                    </p>
                    <p className="text-[11px] text-[#969690]">
                      Updated{' '}
                      {new Date(d.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-semibold text-[#29483A] dark:text-[#78C295]" title={`Author: ${d.author.name}`}>
                    {d.author.name.charAt(0)}
                  </div>

                  <ChevronRight className="h-4 w-4 text-[#969690] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F5F2] dark:bg-[#1D2026] text-[#969690] mb-3">
              <FileQuestion className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
              No decisions found
            </h3>
            <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] max-w-sm mt-1">
              No architectural decision records match your current search or filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTeamFilter('all');
              }}
              className="mt-4 text-xs font-semibold text-[#365B4B] dark:text-[#78C295] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
