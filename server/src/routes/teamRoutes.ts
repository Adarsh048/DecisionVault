import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createTeamSchema, updateTeamSchema } from '../validators/teamSchemas';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from '../controllers/TeamController';

const router = Router({ mergeParams: true }); // Access :orgId from parent

// All team routes require authentication
router.use(authenticate);

// GET    /api/v1/organizations/:orgId/teams       — list teams (viewer+)
router.get('/', authorize('viewer'), getTeams);

// POST   /api/v1/organizations/:orgId/teams       — create team (admin+)
router.post('/', authorize('admin'), validate(createTeamSchema), createTeam);

// GET    /api/v1/organizations/:orgId/teams/:id   — get team (viewer+)
router.get('/:id', authorize('viewer'), getTeam);

// PATCH  /api/v1/organizations/:orgId/teams/:id   — update team (admin+)
router.patch('/:id', authorize('admin'), validate(updateTeamSchema), updateTeam);

// DELETE /api/v1/organizations/:orgId/teams/:id   — delete team (admin+)
router.delete('/:id', authorize('admin'), deleteTeam);

// POST   /api/v1/organizations/:orgId/teams/:id/members — add member (admin+)
router.post('/:id/members', authorize('admin'), addTeamMember);

// DELETE /api/v1/organizations/:orgId/teams/:id/members/:userId — remove member (admin+)
router.delete('/:id/members/:userId', authorize('admin'), removeTeamMember);

export default router;
