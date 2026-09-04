import { teamRepository } from '../repositories/TeamRepository';
import { NotFoundError } from '../utils/AppError';
import type { CreateTeamInput, UpdateTeamInput } from '../validators/teamSchemas';

export class TeamService {
  async create(input: CreateTeamInput, organizationId: string, creatorId: string) {
    const team = await teamRepository.create({
      ...input,
      organizationId,
      members: input.members ? [...new Set([creatorId, ...input.members])] : [creatorId],
    });
    return team.toJSON();
  }

  async getById(teamId: string) {
    const team = await teamRepository.findByIdWithMembers(teamId);
    if (!team) throw new NotFoundError('Team');
    return team.toJSON();
  }

  async getByOrganization(organizationId: string) {
    const teams = await teamRepository.findByOrganization(organizationId);
    return teams.map((t) => t.toJSON());
  }

  async update(teamId: string, data: UpdateTeamInput) {
    const team = await teamRepository.update(teamId, data);
    if (!team) throw new NotFoundError('Team');
    return team.toJSON();
  }

  async delete(teamId: string) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new NotFoundError('Team');
    await teamRepository.delete(teamId);
  }

  async addMember(teamId: string, userId: string) {
    const team = await teamRepository.addMember(teamId, userId);
    if (!team) throw new NotFoundError('Team');
    return team.toJSON();
  }

  async removeMember(teamId: string, userId: string) {
    const team = await teamRepository.removeMember(teamId, userId);
    if (!team) throw new NotFoundError('Team');
    return team.toJSON();
  }
}

export const teamService = new TeamService();
