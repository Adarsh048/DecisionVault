import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FilePlus2,
  Users,
  MessageSquare,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';

interface AuditEvent {
  id: string;
  type: 'created' | 'status_change' | 'team_update' | 'comment';
  user: {
    name: string;
    role: string;
  };
  action: string;
  targetTitle?: string;
  targetId?: string;
  badge: string;
  timestamp: string;
}

export function ActivityPage() {
  const { decisions } = useDecisionStore();
  const [filter, setFilter] = useState<'all' | 'status_change' | 'created' | 'team_update'>('all');

  const activities: AuditEvent[] = useMemo(() => {
    return decisions.map((d) => ({
      id: `act-${d.id}`,
      type: d.status === 'proposed' ? 'created' : 'status_change',
      user: { name: d.author.name, role: d.author.role },
      action:
        d.status === 'accepted'
          ? 'approved and marked status as Accepted'
          : d.status === 'deprecated'
          ? 'marked decision as Deprecated'
          : 'authored and submitted proposal',
      targetTitle: `ADR-${String(d.number).padStart(3, '0')}: ${d.title}`,
      targetId: d.id,
      badge: d.status,
      timestamp: new Date(d.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }, [decisions]);

  const filtered = activities.filter((a) => (filter === 'all' ? true : a.type === filter));

  const getIcon = (type: AuditEvent['type']) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle2 className="h-4 w-4 text-[#275B3D] dark:text-[#78C295]" />;
      case 'created':
        return <FilePlus2 className="h-4 w-4 text-[#365B4B] dark:text-[#78C295]" />;
      case 'team_update':
        return <Users className="h-4 w-4 text-[#6D28D9] dark:text-[#C4B5FD]" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-[#9A5B13] dark:text-[#F3B367]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] md:text-3xl">
            Activity Log
          </h1>
          <p className="mt-1 text-sm text-[#6B6B66] dark:text-[#9E9EA8]">
            Audit trail of decision proposals, peer consensus, and workspace changes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] p-0.5 bg-[#FFFFFF] dark:bg-[#16181D] text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                : 'text-[#6B6B66] dark:text-[#9E9EA8]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('status_change')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              filter === 'status_change'
                ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                : 'text-[#6B6B66] dark:text-[#9E9EA8]'
            }`}
          >
            Status
          </button>
          <button
            type="button"
            onClick={() => setFilter('created')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              filter === 'created'
                ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                : 'text-[#6B6B66] dark:text-[#9E9EA8]'
            }`}
          >
            Proposals
          </button>
          <button
            type="button"
            onClick={() => setFilter('team_update')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              filter === 'team_update'
                ? 'bg-[#E7F0EA] text-[#29483A] dark:bg-[#1F2E25] dark:text-[#78C295]'
                : 'text-[#6B6B66] dark:text-[#9E9EA8]'
            }`}
          >
            Teams
          </button>
        </div>
      </div>

      {/* ─── Timeline List ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-12 text-center shadow-subtle">
          <Clock className="h-8 w-8 mx-auto mb-2 text-[#969690] opacity-40" />
          <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
            No activity logged yet
          </p>
          <p className="text-[11px] text-[#969690] mt-1">
            Activity entries will appear here automatically when decisions are proposed or reviewed.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle divide-y divide-[#E8E8E3] dark:divide-[#2B2E36] overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-5 hover:bg-[#F5F5F2] dark:hover:bg-[#1D2026] transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F2] dark:bg-[#1D2026] border border-[#E8E8E3] dark:border-[#2B2E36] mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                    {item.user.name}
                  </span>
                  <span className="text-[11px] text-[#969690]">({item.user.role})</span>
                  <span className="text-[#6B6B66] dark:text-[#9E9EA8]">{item.action}</span>
                </div>

                {item.targetTitle && (
                  <p className="text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] pt-0.5">
                    {item.targetId ? (
                      <Link
                        to={`/app/decisions/${item.targetId}`}
                        className="text-[#365B4B] dark:text-[#78C295] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{item.targetTitle}</span>
                        <ArrowRight className="h-3 w-3 inline" />
                      </Link>
                    ) : (
                      <span>{item.targetTitle}</span>
                    )}
                  </p>
                )}

                <p className="text-[11px] text-[#969690] pt-1">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
