import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useNotificationStore, markDecisionDialogSeen } from '@/store/notificationStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';

export function NewDecisionProposalModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const {
    activeProposalDialog,
    dismissProposalDialog,
    markAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (activeProposalDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeProposalDialog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeProposalDialog) {
        if (activeProposalDialog.decisionId && user?.email) {
          markDecisionDialogSeen(activeProposalDialog.decisionId, user.email);
        }
        dismissProposalDialog(activeProposalDialog.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProposalDialog, dismissProposalDialog, user?.email]);

  if (!activeProposalDialog) {
    return null;
  }

  const notification = activeProposalDialog;
  const isOwnerProposal =
    notification.isOwnerProposal ||
    notification.author?.role?.toLowerCase().includes('owner') ||
    notification.author?.email?.toLowerCase().includes('admin@');

  const handleOpenDecision = () => {
    if (notification.decisionId && user?.email) {
      markDecisionDialogSeen(notification.decisionId, user.email);
    }
    markAsRead(notification.id);
    dismissProposalDialog(notification.id);
    if (notification.decisionId) {
      navigate(`/app/decisions/${notification.decisionId}`);
    } else {
      navigate('/app/decisions');
    }
  };

  const handleReviewLater = () => {
    if (notification.decisionId && user?.email) {
      markDecisionDialogSeen(notification.decisionId, user.email);
    }
    dismissProposalDialog(notification.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-dialog-title"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Gradient Banner / Header */}
        <div className="relative px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-gradient-to-r from-[#FEF7EE] via-[#FDF5E8] to-[#FFFFFF] dark:from-[#241F16] dark:via-[#1F1C18] dark:to-[#16181D]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF7EE] dark:bg-[#2F2417] text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524] shadow-sm">
                {isOwnerProposal ? (
                  <Crown className="h-5 w-5 text-[#D97706]" />
                ) : (
                  <Sparkles className="h-5 w-5 text-[#365B4B] dark:text-[#78C295]" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF7EE] dark:bg-[#2A2318] px-2 py-0.5 text-[11px] font-bold text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#5C4524]">
                    {isOwnerProposal ? (
                      <>
                        <Crown className="h-3 w-3 inline" />
                        <span>Owner Proposal</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 inline" />
                        <span>Team Proposal</span>
                      </>
                    )}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF7EE] dark:bg-[#2E2619] px-2 py-0.5 text-[11px] font-medium text-[#9A5B13] dark:text-[#F3B367] border border-[#F8DCBA] dark:border-[#523F21]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
                    <span>Status: Proposed</span>
                  </span>
                </div>

                <h2
                  id="proposal-dialog-title"
                  className="mt-1.5 text-base sm:text-lg font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] leading-snug"
                >
                  New Architectural Decision Proposed
                </h2>
                <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                  {notification.author?.name || 'Workspace Owner'} submitted an ADR requiring review.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReviewLater}
              className="rounded-lg p-1.5 text-[#969690] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] hover:bg-[#F5F5F2] dark:hover:bg-[#252830] transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4">
          
          {/* Main Decision Preview Card */}
          <div className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#1D2026] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295] border border-[#C6E4D1] dark:border-[#284936]">
                ADR-{String(notification.decisionNumber || 1).padStart(3, '0')}
              </span>
              
              {notification.team && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
                  <Users className="h-3 w-3" />
                  <span>{notification.team}</span>
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#1C1C1A] dark:text-[#E8EAEF] leading-snug">
              {notification.decisionTitle || notification.title}
            </h3>

            {/* Author Attribution */}
            <div className="flex items-center gap-2.5 pt-1 border-t border-[#E8E8E3]/70 dark:border-[#2B2E36]/70">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] text-xs font-bold text-[#29483A] dark:text-[#78C295]">
                {notification.author?.name ? notification.author.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                    {notification.author?.name || 'Sarah Chen'}
                  </span>
                  <span className="text-[11px] text-[#969690]">
                    ({notification.author?.role || 'Owner & Lead Architect'})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#969690] shrink-0">
                <Clock className="h-3 w-3" />
                <span>Just now</span>
              </div>
            </div>

            {/* Context / Excerpt Quote */}
            {notification.context && (
              <div className="rounded-lg bg-[#FFFFFF] dark:bg-[#16181D] border border-[#E8E8E3] dark:border-[#2B2E36] p-3 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B6B66] dark:text-[#9E9EA8] uppercase tracking-wider mb-1">
                  <FileText className="h-3.5 w-3.5 text-[#365B4B] dark:text-[#78C295]" />
                  <span>Proposed Problem & Context</span>
                </div>
                <p className="text-[#4A4A45] dark:text-[#C5C8D4] leading-relaxed line-clamp-3 italic">
                  "{notification.context}"
                </p>
              </div>
            )}
          </div>

          {/* Role-Specific Action Banner */}
          <div className="rounded-xl border border-[#C6E4D1] dark:border-[#284936] bg-[#EBF5EE] dark:bg-[#192B21] p-3.5 text-xs text-[#275B3D] dark:text-[#78C295] flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {permissions.isMember
                  ? '⚡ Engineer Action: Review & Voting Requested'
                  : permissions.isViewer
                  ? '👁️ Stakeholder Notification: Visibility & Audit'
                  : '⚡ Peer Review Requested'}
              </p>
              <p className="mt-0.5 opacity-90 leading-relaxed text-[11px]">
                {permissions.isMember
                  ? 'As an engineering team member, your architectural review and vote help determine whether this proposed ADR is accepted into production.'
                  : permissions.isViewer
                  ? 'As a stakeholder/viewer, you have full visibility to inspect the proposal context, alternatives considered, and trade-off consequences.'
                  : 'Review the proposed architecture, cast your upvote or downvote, and submit feedback.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#191B21] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <button
            type="button"
            onClick={handleReviewLater}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#252830] transition-colors"
          >
            Review Later (Keep Unread)
          </button>

          <button
            type="button"
            autoFocus
            onClick={handleOpenDecision}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] text-white text-xs font-semibold shadow-subtle transition-all transform active:scale-98"
          >
            <span>Review & Cast Vote</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
