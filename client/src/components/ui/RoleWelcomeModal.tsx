import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PartyPopper,
  CheckCircle2,
  FileText,
  Vote,
  WifiOff,
  MessageSquare,
  Search,
  Shield,
  Users,
  Building2,
  ArrowRight,
  X,
  Sparkles,
  Lock,
  Crown,
} from 'lucide-react';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role } from '@/lib/constants';

interface RoleCapability {
  icon: any;
  title: string;
  description: string;
  badge?: string;
}

export function RoleWelcomeModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const {
    activeWelcomeDialog,
    dismissWelcomeDialog,
  } = useUserApprovalStore();

  useEffect(() => {
    if (activeWelcomeDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeWelcomeDialog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeWelcomeDialog) {
        dismissWelcomeDialog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWelcomeDialog, dismissWelcomeDialog]);

  if (!activeWelcomeDialog) {
    return null;
  }

  const role: Role = activeWelcomeDialog.role || permissions.role || 'member';
  const team = activeWelcomeDialog.team || 'Platform Engineering';
  const reviewerName = activeWelcomeDialog.reviewedBy || 'Sarah Chen (Owner)';

  const getRoleCapabilities = (currentRole: Role): RoleCapability[] => {
    switch (currentRole) {
      case 'owner':
      case 'admin':
        return [
          {
            icon: Users,
            title: 'Manage Team & Member Approvals',
            description: 'Review incoming account registration requests, approve new engineers, and assign roles.',
            badge: 'Admin Privileges',
          },
          {
            icon: Crown,
            title: 'Accept & Supersede Architecture Decisions',
            description: 'Finalize status transitions on ADRs, accept proposals into production standards, and archive legacy decisions.',
          },
          {
            icon: FileText,
            title: 'Author Critical Architectural RFCs',
            description: 'Draft and propose organization-wide standards with automatic real-time alerts to all engineers.',
          },
          {
            icon: Shield,
            title: 'Workspace Governance & Audit Logs',
            description: 'Monitor compliance audit trails, security configurations, and role permissions across all teams.',
          },
        ];

      case 'member':
        return [
          {
            icon: FileText,
            title: 'Create & Propose New Decisions (ADRs)',
            description: 'Submit architectural proposals, document technical context, trade-offs, and consequences with Markdown & Mermaid diagrams.',
            badge: 'Write Access',
          },
          {
            icon: Vote,
            title: 'Review & Cast Votes on Team Proposals',
            description: 'Receive real-time dialogue alerts for decisions proposed by the Owner and teammates; cast your upvote or downvote.',
          },
          {
            icon: WifiOff,
            title: 'Local-First Offline Drafting',
            description: 'Work with zero latency. Drafts and edits autosave to local IndexedDB and reconcile seamlessly when reconnected.',
          },
          {
            icon: MessageSquare,
            title: 'Participate in Design Reviews & Feedback',
            description: 'Collaborate with fellow engineers to refine system design before decisions are accepted into production standards.',
          },
          {
            icon: Search,
            title: 'Global Search & Knowledge Vault',
            description: 'Query historical records by team, status, tags, and architectural consequences with ⌘K quick search.',
          },
        ];

      case 'viewer':
      default:
        return [
          {
            icon: FileText,
            title: 'Full Architectural Visibility',
            description: 'Read and audit all historical and active architectural decision records across every engineering team.',
            badge: 'Read-Only Audit',
          },
          {
            icon: Search,
            title: 'Faceted & Full-Text Search',
            description: 'Search across tags, status, teams, authors, and decision consequences with instant client-side indexing.',
          },
          {
            icon: Sparkles,
            title: 'Real-Time Proposal Notifications',
            description: 'Receive interactive dialogue box alerts whenever the Owner or engineers propose changes impacting your roadmap.',
          },
          {
            icon: Lock,
            title: 'Zero-Risk Exploration',
            description: 'Audit records and compliance documentation without the risk of accidental modification or deletion.',
          },
        ];
    }
  };

  const capabilities = getRoleCapabilities(role);

  const handleGetStarted = () => {
    dismissWelcomeDialog();
    navigate('/app/dashboard');
  };

  const handleBrowseDecisions = () => {
    dismissWelcomeDialog();
    navigate('/app/decisions');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-role-title"
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Celebration Header */}
        <div className="relative px-5 pt-6 pb-4 sm:px-7 sm:pt-7 border-b border-[#E8E8E3] dark:border-[#2B2E36] bg-gradient-to-br from-[#EBF5EE] via-[#F4F9F6] to-[#FFFFFF] dark:from-[#17261E] dark:via-[#19221D] dark:to-[#16181D]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295] border border-[#C6E4D1] dark:border-[#284936] shadow-sm">
                <PartyPopper className="h-6 w-6 animate-bounce" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EBF5EE] dark:bg-[#192B21] px-2 py-0.5 text-[11px] font-bold text-[#275B3D] dark:text-[#78C295] border border-[#C6E4D1] dark:border-[#284936]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Access Approved</span>
                  </span>

                  <span className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8]">
                    Reviewed by {reviewerName}
                  </span>
                </div>

                <h2
                  id="welcome-role-title"
                  className="mt-1.5 text-lg sm:text-xl font-bold text-[#1C1C1A] dark:text-[#E8EAEF] leading-snug"
                >
                  Welcome to DecisionVault, {activeWelcomeDialog.name || user?.name || 'Teammate'}!
                </h2>
                <p className="text-xs text-[#6B6B66] dark:text-[#9E9EA8] mt-0.5">
                  Your access request has been granted. Here is your assigned role and what you can do in the workspace.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissWelcomeDialog()}
              className="rounded-lg p-1.5 text-[#969690] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] hover:bg-[#F5F5F2] dark:hover:bg-[#252830] transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5 space-y-4">
          
          {/* Role & Team Spotlight Card */}
          <div className="rounded-xl border border-[#C6E4D1] dark:border-[#284936] bg-[#FAFAF8] dark:bg-[#1C1F26] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B66] dark:text-[#9E9EA8]">
                Your Assigned Role
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-[#1C1C1A] dark:text-[#E8EAEF]">
                  {role === 'owner'
                    ? 'Organization Owner & Lead'
                    : role === 'admin'
                    ? 'Administrator'
                    : role === 'member'
                    ? 'Engineer (Member)'
                    : 'Stakeholder (Viewer)'}
                </span>
                <span className="rounded-full bg-[#E7F0EA] dark:bg-[#1F2E25] px-2 py-0.5 text-[10px] font-bold text-[#29483A] dark:text-[#78C295] border border-[#C6E4D1] dark:border-[#284936]">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:text-right">
              <Building2 className="h-4 w-4 text-[#969690]" />
              <div>
                <p className="text-[10px] text-[#969690]">Assigned Team</p>
                <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">{team}</p>
              </div>
            </div>
          </div>

          {/* "You can do all these things in it" Capabilities Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6B66] dark:text-[#9E9EA8]">
                What you can do in DecisionVault:
              </h3>
              <span className="text-[11px] font-medium text-[#29483A] dark:text-[#78C295]">
                {capabilities.length} capabilities granted
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {capabilities.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#181B22] p-3 flex items-start gap-3 hover:border-[#365B4B]/40 dark:hover:border-[#78C295]/40 transition-colors shadow-2xs"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F0EA] dark:bg-[#1F2E25] text-[#29483A] dark:text-[#78C295] mt-0.5">
                    <item.icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                        {item.title}
                      </p>
                      {item.badge && (
                        <span className="rounded bg-[#EAEAE6] dark:bg-[#252830] px-1.5 py-0.2 text-[9px] font-medium text-[#4A4A45] dark:text-[#B0B3BE] shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#555550] dark:text-[#B0B3BE] mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-7 sm:py-4 border-t border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FAFAF8] dark:bg-[#191B21] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <button
            type="button"
            onClick={handleBrowseDecisions}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:bg-[#F5F5F2] dark:hover:bg-[#252830] transition-colors"
          >
            Browse Decision Records
          </button>

          <button
            type="button"
            autoFocus
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] text-white text-xs font-semibold shadow-subtle transition-all transform active:scale-98"
          >
            <span>Explore My Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
