import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useOrganizationStore } from '@/store/organizationStore';
import { useUserApprovalStore } from '@/store/userApprovalStore';
import type { Role } from '@/lib/constants';

export interface UserPermissions {
  role: Role;
  roleLabel: string;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
  isPendingApproval: boolean;
  canCreateDecisions: boolean;
  canEditDecisions: boolean;
  canDeleteDecisions: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  badgeClass: string;
}

export function usePermissions(): UserPermissions {
  const user = useAuthStore((state) => state.user);
  const activeOrg = useOrganizationStore((state) => state.activeOrganization);
  const approvals = useUserApprovalStore((state) => state.approvals);

  return useMemo(() => {
    // 1. Check if user is in userApprovalStore
    const userApproval = user?.email
      ? approvals.find((a) => a.email.toLowerCase() === user.email.toLowerCase())
      : undefined;

    let role: Role = 'member';
    let isPendingApproval = false;

    if (userApproval) {
      if (userApproval.status === 'pending') {
        isPendingApproval = true;
        role = 'viewer'; // restricted while pending
      } else if (userApproval.status === 'approved' && userApproval.assignedRole) {
        role = userApproval.assignedRole;
      }
    } else if (user && activeOrg && activeOrg.members) {
      const membership = activeOrg.members.find(
        (m) => m.userId === user._id || m.user?._id === user._id
      );
      if (membership) {
        role = membership.role;
      } else if (activeOrg.owner === user._id) {
        role = 'owner';
      }
    } else if (user?.email) {
      // Demo accounts / heuristics if org is not yet loaded
      if (user.email.includes('admin@') || user.email.includes('sarah@')) {
        role = 'owner';
      } else if (user.email.includes('viewer@') || user.email.includes('jordan@')) {
        role = 'viewer';
      } else if (user.email.includes('alex@')) {
        role = 'member';
      } else {
        // Unknown newly registered account default to pending if not approved
        isPendingApproval = true;
        role = 'viewer';
      }
    }

    const isOwner = role === 'owner';
    const isAdmin = role === 'admin' || isOwner;
    const isMember = role === 'member';
    const isViewer = role === 'viewer';

    let roleLabel = isOwner
      ? 'Owner & Lead'
      : isAdmin
      ? 'Admin'
      : isMember
      ? 'Engineer (Member)'
      : 'Stakeholder (Viewer)';

    let badgeClass = isOwner
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : isAdmin
      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
      : isMember
      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

    if (isPendingApproval) {
      roleLabel = 'Pending Owner Review';
      badgeClass = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse font-semibold';
    }

    return {
      role,
      roleLabel,
      isOwner,
      isAdmin,
      isMember,
      isViewer,
      isPendingApproval,
      canCreateDecisions: !isViewer && !isPendingApproval,
      canEditDecisions: !isViewer && !isPendingApproval,
      canDeleteDecisions: isAdmin,
      canManageTeam: isAdmin,
      canManageSettings: isAdmin,
      badgeClass,
    };
  }, [user, activeOrg, approvals]);
}
