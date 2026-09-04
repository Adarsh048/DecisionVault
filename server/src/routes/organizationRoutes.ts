import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../validators/organizationSchemas';
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
  getRoster,
  assignRole,
  rejectRequest,
} from '../controllers/OrganizationController';

const router = Router();

// All org routes require authentication
router.use(authenticate);

// GET /api/v1/organizations/roster — get roster & pending accounts for default org
router.get('/roster', getRoster);
router.get('/:id/roster', getRoster);

// POST /api/v1/organizations/assign-role — Owner assigns role to a user
router.post('/assign-role', assignRole);
router.post('/:id/assign-role', assignRole);

// POST /api/v1/organizations/reject-request — Owner denies access request
router.post('/reject-request', rejectRequest);
router.post('/:id/reject-request', rejectRequest);

// GET    /api/v1/organizations        — list user's orgs
router.get('/', getOrganizations);

// POST   /api/v1/organizations        — create org
router.post('/', validate(createOrganizationSchema), createOrganization);

// GET    /api/v1/organizations/:id    — get org details (viewer+)
router.get('/:id', authorize('viewer'), getOrganization);

// PATCH  /api/v1/organizations/:id    — update org (admin+)
router.patch('/:id', authorize('admin'), validate(updateOrganizationSchema), updateOrganization);

// DELETE /api/v1/organizations/:id    — delete org (owner only)
router.delete('/:id', authorize('owner'), deleteOrganization);

// POST   /api/v1/organizations/:id/invite — invite member (admin+)
router.post('/:id/invite', authorize('admin'), validate(inviteMemberSchema), inviteMember);

// PATCH  /api/v1/organizations/:id/members/:userId — change role (admin+)
router.patch('/:id/members/:userId', authorize('admin'), validate(updateMemberRoleSchema), updateMemberRole);

// DELETE /api/v1/organizations/:id/members/:userId — remove member (admin+)
router.delete('/:id/members/:userId', authorize('admin'), removeMember);

export default router;
