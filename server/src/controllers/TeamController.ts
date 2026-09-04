import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/TeamService';
import { ApiResponse } from '../utils/ApiResponse';

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.create(req.body, req.params.orgId, req.user!.userId);
    ApiResponse.success({ res, statusCode: 201, message: 'Team created', data: { team } });
  } catch (err) { next(err); }
}

export async function getTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await teamService.getByOrganization(req.params.orgId);
    ApiResponse.success({ res, message: 'Teams retrieved', data: { teams } });
  } catch (err) { next(err); }
}

export async function getTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.getById(req.params.id);
    ApiResponse.success({ res, message: 'Team retrieved', data: { team } });
  } catch (err) { next(err); }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.update(req.params.id, req.body);
    ApiResponse.success({ res, message: 'Team updated', data: { team } });
  } catch (err) { next(err); }
}

export async function deleteTeam(req: Request, res: Response, next: NextFunction) {
  try {
    await teamService.delete(req.params.id);
    ApiResponse.success({ res, message: 'Team deleted' });
  } catch (err) { next(err); }
}

export async function addTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.addMember(req.params.id, req.body.userId);
    ApiResponse.success({ res, message: 'Member added to team', data: { team } });
  } catch (err) { next(err); }
}

export async function removeTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.removeMember(req.params.id, req.params.userId);
    ApiResponse.success({ res, message: 'Member removed from team', data: { team } });
  } catch (err) { next(err); }
}
