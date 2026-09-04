import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/OrganizationService';
import { ApiResponse } from '../utils/ApiResponse';

export async function createOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await organizationService.create(req.body, req.user!.userId);
    ApiResponse.success({ res, statusCode: 201, message: 'Organization created', data: { organization: org } });
  } catch (err) { next(err); }
}

export async function getOrganizations(req: Request, res: Response, next: NextFunction) {
  try {
    const orgs = await organizationService.getUserOrganizations(req.user!.userId);
    ApiResponse.success({ res, message: 'Organizations retrieved', data: { organizations: orgs } });
  } catch (err) { next(err); }
}

export async function getOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await organizationService.getById(req.params.id);
    ApiResponse.success({ res, message: 'Organization retrieved', data: { organization: org } });
  } catch (err) { next(err); }
}

export async function updateOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await organizationService.update(req.params.id, req.body);
    ApiResponse.success({ res, message: 'Organization updated', data: { organization: org } });
  } catch (err) { next(err); }
}

export async function deleteOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    await organizationService.delete(req.params.id);
    ApiResponse.success({ res, message: 'Organization deleted' });
  } catch (err) { next(err); }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await organizationService.inviteMember(req.params.id, req.body.email, req.body.role);
    ApiResponse.success({ res, statusCode: 201, message: result.message });
  } catch (err) { next(err); }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await organizationService.updateMemberRole(req.params.id, req.params.userId, req.body.role);
    ApiResponse.success({ res, message: 'Member role updated', data: { organization: org } });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    await organizationService.removeMember(req.params.id, req.params.userId);
    ApiResponse.success({ res, message: 'Member removed' });
  } catch (err) { next(err); }
}

export async function getRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await organizationService.getRoster(req.params.id || 'acme-corp', req.user!.userId);
    ApiResponse.success({ res, message: 'Organization roster retrieved', data });
  } catch (err) { next(err); }
}

export async function assignRole(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await organizationService.assignRoleAndTeam(
      req.params.id || 'acme-corp',
      req.body.userId,
      req.body.role,
      req.body.teamName,
      req.user!.userId
    );
    ApiResponse.success({ res, message: result.message });
  } catch (err) { next(err); }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await organizationService.rejectRequest(
      req.params.id || 'acme-corp',
      req.body.userId,
      req.user!.userId
    );
    ApiResponse.success({ res, message: result.message });
  } catch (err) { next(err); }
}
