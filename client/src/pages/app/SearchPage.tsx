import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  X,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function SearchPage() {
  const { decisions } = useDecisionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'smart'>('keyword');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const popularQueries = [
    'Hybrid CRDTs & Sync',
    'PostgreSQL Database',
    'WebSockets Messaging',
    'Role-Based Access Control',
  ];

  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesTeam = teamFilter === 'all' || d.team === teamFilter;

      if (!q) return matchesStatus && matchesTeam;

      // Smart semantic vs keyword search simulation
      if (searchMode === 'smart') {
        const words = q.split(/\s+/).filter(Boolean);
        const corpus = `${d.title} ${d.context} ${d.decision} ${d.consequences} ${d.tags.join(' ')}`.toLowerCase();
        const matchesAnyWord = words.some((w) => corpus.includes(w));
        return matchesAnyWord && matchesStatus && matchesTeam;
      }

      // Keyword match
      const textCorpus = `${d.title} ${d.context} ${d.decision} ${d.tags.join(' ')}`.toLowerCase();
      return textCorpus.includes(q) && matchesStatus && matchesTeam;
    });
  }, [decisions, searchTerm, searchMode, statusFilter, teamFilter]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl">
          Search Decisions
        </h1>
        <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
          Find the historical rationale, context, and trade-offs behind any architectural choice.
        </p>
      </div>

      {/* ─── Command-Palette Search Box ───────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-5 shadow-subtle space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#969690]" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Why did we choose PostgreSQL? (or search by technology, ADR number, rationale)..."
            className="h-11 w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] pl-10 pr-10 text-sm text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:bg-[#FFFFFF] dark:focus:bg-[#16181D] focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#969690] hover:text-[#1C1C1A]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mode Selector & Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E8E3] dark:border-[#2B2E36] text-xs">
          {/* Search Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#969690]">Search mode:</span>
            <div className="inline-flex rounded-md border border-[#E8E8E3] dark:border-[#2B2E36] p-0.5 bg-[#F5F5F2] dark:bg-[#1D2026]">
              <button
                type="button"
                onClick={() => setSearchMode('keyword')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  searchMode === 'keyword'
                    ? 'bg-[#FFFFFF] dark:bg-[#16181D] text-[#1C1C1A] dark:text-[#E8EAEF] shadow-subtle'
                    : 'text-[#6B6B66] dark:text-[#9E9EA8]'
                }`}
              >
                Keyword
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('smart')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  searchMode === 'smart'
                    ? 'bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295] shadow-subtle'
                    : 'text-[#6B6B66] dark:text-[#9E9EA8]'
                }`}
              >
                <Sparkles className="h-3 w-3 text-[#365B4B] dark:text-[#78C295]" />
                <span>Smart Search</span>
              </button>
            </div>
          </div>

          {/* Status & Team Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2 py-1 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] focus:border-[#365B4B] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="proposed">Proposed</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="rounded-md border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-2 py-1 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] focus:border-[#365B4B] focus:outline-none"
            >
              <option value="all">All Teams</option>
              <option value="Platform Engineering">Platform Engineering</option>
              <option value="Product & Design">Product & Design</option>
            </select>
          </div>
        </div>

        {/* Suggested Queries */}
        {!searchTerm && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#969690]">
            <span className="text-[11px]">Popular:</span>
            {popularQueries.map((pq) => (
              <button
                key={pq}
                type="button"
                onClick={() => setSearchTerm(pq)}
                className="rounded-md bg-[#F5F5F2] dark:bg-[#1D2026] hover:bg-[#EFEFEB] px-2 py-0.5 text-xs text-[#6B6B66] dark:text-[#9E9EA8] border border-[#E8E8E3] dark:border-[#2B2E36] transition-colors"
              >
                {pq}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Search Results Section ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#6B6B66] dark:text-[#9E9EA8] px-1">
          <span>
            {filtered.length} record{filtered.length === 1 ? '' : 's'} found
          </span>
          {searchTerm && (
            <span>
              Searching via {searchMode === 'smart' ? 'Smart Semantic matching' : 'Keyword matching'}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle divide-y divide-[#E8E8E3] dark:divide-[#2B2E36] overflow-hidden">
          {filtered.length > 0 ? (
            filtered.map((d) => (
              <Link
                key={d.id}
                to={`/app/decisions/${d.id}`}
                className="group block p-5 transition-colors hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026]"
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#969690]">
                      ADR-{String(d.number).padStart(3, '0')}
                    </span>
                    <h3 className="text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] group-hover:text-[#365B4B] dark:group-hover:text-[#78C295] transition-colors">
                      {d.title}
                    </h3>
                  </div>
                  <StatusBadge status={d.status} size="sm" />
                </div>

                <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] leading-relaxed line-clamp-2">
                  {d.decision || d.context}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#969690] pt-2 border-t border-[#E8E8E3]/60 dark:border-[#2B2E36]/60">
                  <div className="flex items-center gap-3">
                    <span>{d.team}</span>
                    <span>·</span>
                    <span>Author: {d.author.name}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[#365B4B] dark:text-[#78C295] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View rationale</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-16 text-center text-xs">
              <FileText className="h-8 w-8 mx-auto text-[#969690] mb-2" />
              <p className="font-medium text-[#1C1C1A] dark:text-[#E8EAEF]">
                No matching architectural decisions found
              </p>
              <p className="text-[#6B6B66] dark:text-[#9E9EA8] mt-1 max-w-sm mx-auto">
                Try using alternate keywords or switch to Smart Search to locate decisions by conceptual rationale.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
