import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Save,
  WifiOff,
  Check,
} from 'lucide-react';
import { useDecisionStore } from '@/store/decisionStore';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useSyncStore } from '@/store/syncStore';
import { db } from '@/lib/db';
import { socketService } from '@/services/socketService';
import type { DecisionStatus } from '@/lib/constants';

export function CreateDecisionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { addDecision } = useDecisionStore();
  const sync = useSyncStore();

  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('Platform Engineering');
  const [status, setStatus] = useState<DecisionStatus>('proposed');
  const [tags, setTags] = useState('Architecture, Platform, Infrastructure');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [consequences, setConsequences] = useState('');
  const [error, setError] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Hydrate draft from local IndexedDB if present
  useEffect(() => {
    db.drafts.get('new-decision-draft').then((draft) => {
      if (draft && (draft.title || draft.context || draft.decision)) {
        setTitle(draft.title || '');
        setTeam(draft.team || 'Platform Engineering');
        setStatus((draft.status as DecisionStatus) || 'proposed');
        setTags(draft.tags ? draft.tags.join(', ') : 'Architecture, Platform, Infrastructure');
        setContext(draft.context || '');
        setDecision(draft.decision || '');
        setConsequences(draft.consequences || '');
        setDraftLoaded(true);
      }
    }).catch(console.error);
  }, []);

  // Autosave to IndexedDB draft table
  useEffect(() => {
    if (!title && !context && !decision) return;
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const timer = setTimeout(() => {
      db.drafts.put({
        id: 'new-decision-draft',
        title,
        team,
        status,
        tags: tagList,
        context,
        decision,
        consequences,
        updatedAt: new Date().toISOString(),
      }).catch(console.error);
    }, 400);

    return () => clearTimeout(timer);
  }, [title, team, status, tags, context, decision, consequences]);

  const handleSubmit = (e?: React.FormEvent, customStatus?: DecisionStatus) => {
    if (e) e.preventDefault();
    if (!permissions.canCreateDecisions) {
      setError('Stakeholders have read-only access and cannot create decisions.');
      return;
    }

    if (!title.trim() || !context.trim() || !decision.trim()) {
      setError('Please provide a Title, Context, and Final Decision.');
      return;
    }

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = addDecision({
      title: title.trim(),
      team,
      status: customStatus || status,
      tags: tagList,
      context: context.trim(),
      decision: decision.trim(),
      consequences: consequences.trim() || 'No significant adverse trade-offs identified.',
      author: {
        id: user?._id || 'u-local',
        name: user?.name || 'Authorized Engineer',
        email: user?.email || 'engineer@decisionvault.io',
        role: permissions.roleLabel,
      },
    });

    // Clear local draft from IndexedDB
    db.drafts.delete('new-decision-draft').catch(console.error);

    // Broadcast real-time notification & synced record to all other connected teammates
    socketService.broadcastNewDecision(created);

    navigate(`/app/decisions/${created.id}`);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ─── Top Breadcrumb Nav ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-4">
        <Link
          to="/app/decisions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Decisions</span>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {draftLoaded && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#275B3D] dark:text-[#78C295] bg-[#EBF5EE] dark:bg-[#192B21] px-2 py-0.5 rounded border border-[#C6E4D1] dark:border-[#284936]">
              <Check className="h-3 w-3" />
              <span>Draft restored from local vault</span>
            </span>
          )}

          <div className="flex items-center gap-1.5 text-[#6B6B66] dark:text-[#9E9EA8]">
            {!sync.isOnline || sync.status === 'offline' || sync.isSimulatedOffline ? (
              <>
                <WifiOff className="h-3 w-3 text-[#D97706]" />
                <span className="text-[11px] text-[#9A5B13] dark:text-[#F3B367]">
                  Offline · Saved in IndexedDB
                </span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#365B4B]" />
                <span className="text-[11px]">Autosaved to IndexedDB</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Stakeholder Mode Warning ──────────────────────────────────────── */}
      {!permissions.canCreateDecisions && (
        <div className="rounded-xl border border-[#F8DCBA] dark:border-[#5C4524] bg-[#FEF7EE] dark:bg-[#2A2318] p-4 text-xs text-[#9A5B13] dark:text-[#F3B367] flex items-start gap-3">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Stakeholder (Read-Only) Access</p>
            <p className="mt-0.5 opacity-90 leading-relaxed">
              Your current account has read-only stakeholder privileges. You can view all historical architectural decision records, but creating new records requires Engineer or Admin rights.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#F8D7DA] dark:border-[#532626] bg-[#FDF2F2] dark:bg-[#2F1D1D] p-3 text-xs text-[#9B2C2C] dark:text-[#F08C8C]">
          {error}
        </div>
      )}

      {/* ─── Document Editor Surface ───────────────────────────────────────── */}
      <form
        onSubmit={(e) => handleSubmit(e)}
        className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] p-6 md:p-10 shadow-subtle space-y-8"
      >
        {/* Title (Document Style) */}
        <div className="space-y-1">
          <input
            type="text"
            required
            disabled={!permissions.canCreateDecisions}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Decision Title (e.g. Use PostgreSQL for Core Database)"
            className="w-full text-2xl md:text-3xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] border-b border-[#E8E8E3] dark:border-[#2B2E36] pb-3 bg-transparent focus:outline-none focus:border-[#365B4B] transition-colors"
          />
        </div>

        {/* Metadata Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-1.5">
              Engineering Group
            </label>
            <select
              disabled={!permissions.canCreateDecisions}
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none"
            >
              <option value="Platform Engineering">Platform Engineering</option>
              <option value="Product & Design">Product & Design</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-1.5">
              Initial Status
            </label>
            <select
              disabled={!permissions.canCreateDecisions}
              value={status}
              onChange={(e) => setStatus(e.target.value as DecisionStatus)}
              className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none capitalize"
            >
              <option value="proposed">Proposed (Peer review)</option>
              <option value="draft">Draft (Work in progress)</option>
              <option value="accepted">Accepted (Production approved)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#969690] mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              disabled={!permissions.canCreateDecisions}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Database, Storage, Architecture"
              className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#F5F5F2] dark:bg-[#1D2026] px-3 py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] focus:border-[#365B4B] focus:outline-none"
            />
          </div>
        </div>

        {/* Section 1: Problem & Context */}
        <div className="space-y-2 pt-2">
          <label className="block text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
            1. Problem & Context
          </label>
          <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
            What problem are you trying to solve? What is the current architectural bottleneck or requirement?
          </p>
          <textarea
            required
            rows={4}
            disabled={!permissions.canCreateDecisions}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe the context, constraints, and business requirements driving this evaluation..."
            className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-3 text-xs leading-relaxed text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none focus:bg-[#FFFFFF] dark:focus:bg-[#16181D] transition-colors"
          />
        </div>

        {/* Section 2: Final Decision & Solution */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
            2. Decision & Architectural Solution
          </label>
          <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
            What was decided? Which design pattern, technology, or standard is being adopted?
          </p>
          <textarea
            required
            rows={4}
            disabled={!permissions.canCreateDecisions}
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="State the decision clearly in active voice. e.g. 'We will adopt PostgreSQL as our primary database...'"
            className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-3 text-xs leading-relaxed text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none focus:bg-[#FFFFFF] dark:focus:bg-[#16181D] transition-colors"
          />
        </div>

        {/* Section 3: Consequences & Trade-offs */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
            3. Consequences & Trade-offs
          </label>
          <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8]">
            What are the positive outcomes, negative trade-offs, and operational risks introduced?
          </p>
          <textarea
            rows={3}
            disabled={!permissions.canCreateDecisions}
            value={consequences}
            onChange={(e) => setConsequences(e.target.value)}
            placeholder="List expected positive impacts, along with operational trade-offs and migration considerations..."
            className="w-full rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-3 text-xs leading-relaxed text-[#1C1C1A] dark:text-[#E8EAEF] placeholder-[#969690] focus:border-[#365B4B] focus:outline-none focus:bg-[#FFFFFF] dark:focus:bg-[#16181D] transition-colors"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-[#E8E8E3] dark:border-[#2B2E36]">
          <button
            type="button"
            onClick={() => navigate('/app/decisions')}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-4 py-2.5 sm:py-2 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {permissions.canCreateDecisions && (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(undefined, 'draft')}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-4 py-2.5 sm:py-2 text-xs font-medium text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] dark:hover:bg-[#20222B] transition-colors"
                >
                  Save as Draft
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-5 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-subtle transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Publish Decision</span>
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
