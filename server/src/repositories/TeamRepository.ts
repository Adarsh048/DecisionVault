import { Team, ITeam } from '../models/Team';

export class TeamRepository {
  async create(data: {
    name: string;
    description?: string;
    organizationId: string;
    members?: string[];
  }): Promise<ITeam> {
    const team = new Team(data);
    return team.save();
  }

  async findById(id: string): Promise<ITeam | null> {
    return Team.findById(id);
  }

  async findByOrganization(organizationId: string): Promise<ITeam[]> {
    return Team.find({ organizationId }).sort({ name: 1 });
  }

  async update(
    id: string,
    data: Partial<Pick<ITeam, 'name' | 'description'>>
  ): Promise<ITeam | null> {
    return Team.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string): Promise<void> {
    await Team.findByIdAndDelete(id);
  }

  async addMember(teamId: string, userId: string): Promise<ITeam | null> {
    return Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: userId } },
      { new: true }
    );
  }

  async removeMember(teamId: string, userId: string): Promise<ITeam | null> {
    return Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: userId } },
      { new: true }
    );
  }

  async findByIdWithMembers(id: string): Promise<ITeam | null> {
    return Team.findById(id).populate('members', 'name email avatar');
  }

  /**
   * Find teams a user belongs to within an organization.
   */
  async findByUserAndOrg(
    userId: string,
    organizationId: string
  ): Promise<ITeam[]> {
    return Team.find({ organizationId, members: userId });
  }

  /**
   * Delete all teams belonging to an organization.
   */
  async deleteByOrganization(organizationId: string): Promise<void> {
    await Team.deleteMany({ organizationId });
  }
}

export const teamRepository = new TeamRepository();
