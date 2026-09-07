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
  canVoteDecisions: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  badgeClass: string;
}

export function usePermissions(): UserPermissions {
  const user = useAuthStore((state) => state.user);
  const activeOrg = useOrganizationStore((state) => state.activeOrganization);
  const approvals = useUserApprovalStore((state) => state.approvals);

  return useMemo(() => {
    let role: Role = 'viewer';
    let isPendingApproval = false;

    // Check if user is organization root owner or primary architect
    const isRootOwner =
      Boolean(user?._id && activeOrg?.owner && user._id === activeOrg.owner) ||
      Boolean(user?.email && (user.email.toLowerCase().includes('admin@') || user.email.toLowerCase().includes('sarah@')));

    if (isRootOwner) {
      role = 'owner';
      isPendingApproval = false;
    } else {
      // 1. Check user approval store entry
      const userApproval = user?.email
        ? approvals.find((a) => a.email.toLowerCase() === user.email.toLowerCase())
        : undefined;

      // 2. Check active organization membership roster
      const orgMember = (activeOrg?.members || []).find(
        (m: any) =>
          m.userId === user?._id ||
          m.user?._id === user?._id ||
          (user?.email && m.email?.toLowerCase() === user.email.toLowerCase())
      );

      if (userApproval?.status === 'pending') {
        isPendingApproval = true;
        role = 'viewer';
      } else if (orgMember?.status === 'pending') {
        isPendingApproval = true;
        role = 'viewer';
      } else if (user?.membershipStatus === 'pending') {
        isPendingApproval = true;
        role = 'viewer';
      } else if (userApproval?.status === 'approved' && userApproval.assignedRole) {
        role = userApproval.assignedRole;
        isPendingApproval = false;
      } else if (orgMember && orgMember.status === 'active') {
        role = orgMember.role;
        isPendingApproval = false;
      } else if (user?.email) {
        // Pre-configured demo users
        if (user.email.includes('alex@')) {
          role = 'member';
          isPendingApproval = false;
        } else if (user.email.includes('jordan@') || user.email.includes('viewer@')) {
          role = 'viewer';
          isPendingApproval = false;
        } else {
          // Any newly created account is held under review until an admin approves them
          isPendingApproval = true;
          role = 'viewer';
        }
      } else {
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
      canVoteDecisions: !isViewer && !isPendingApproval,
      canDeleteDecisions: isAdmin,
      canManageTeam: isAdmin,
      canManageSettings: isAdmin,
      badgeClass,
    };
  }, [user, activeOrg, approvals]);
}
