import { Request, Response, NextFunction } from 'express';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';
import { ROLE_HIERARCHY, type Role } from '../config/constants';

/**
 * Authorization middleware — checks the user's role in the organization
 * against a minimum required role.
 *
 * Usage in routes:
 *   router.post('/decisions', authenticate, authorize('member'), createDecision);
 *   router.delete('/org/:id', authenticate, authorize('owner'), deleteOrg);
 *
 * The orgId is extracted from:
 *   1. req.params.id or req.params.orgId (for org routes)
 *   2. req.body.organizationId (for decision creation)
 *   3. req.query.organizationId (for decision listing)
 *
 * Architecture note: This middleware sets req.orgMembership so downstream
 * handlers can access the user's role without re-querying.
 */
export function authorize(minimumRole: Role) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      // Extract organization ID from various sources
      const orgId =
        req.params.orgId ||
        req.params.id ||
        (req.body as Record<string, unknown>)?.organizationId as string ||
        req.query.organizationId as string;

      if (!orgId) {
        throw new ForbiddenError('Organization context is required');
      }

      // Look up the user's role in this organization
      const role = await organizationRepository.getMemberRole(orgId, userId);

      if (!role) {
        throw new ForbiddenError('You are not a member of this organization');
      }

      const userLevel = ROLE_HIERARCHY[role] || 0;
      const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

      if (userLevel < requiredLevel) {
        throw new ForbiddenError(
          `This action requires ${minimumRole} role or higher`
        );
      }

      // Attach org membership to request for downstream use
      req.orgMembership = { orgId, role };

      next();
    } catch (err) {
      next(err);
    }
  };
}
