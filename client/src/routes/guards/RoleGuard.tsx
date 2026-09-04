import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useOrganizationStore } from '@/store/organizationStore';
import type { Role } from '@/lib/constants';
import { ROLE_HIERARCHY } from '@/lib/constants';

interface RoleGuardProps {
  minimumRole: Role;
}

/**
 * RoleGuard restricts routes based on the user's role in the active organization.
 * Must be nested inside AuthGuard and requires an active organization.
 */
export function RoleGuard({ minimumRole }: RoleGuardProps) {
  const { user } = useAuthStore();
  const { activeOrganization } = useOrganizationStore();

  if (!user || !activeOrganization) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const membership = activeOrganization.members.find((m) => m.userId === user._id);
  if (!membership) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const userRoleLevel = ROLE_HIERARCHY[membership.role as Role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  if (userRoleLevel < requiredLevel) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
