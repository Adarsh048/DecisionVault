import mongoose from 'mongoose';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { userRepository } from '../repositories/UserRepository';
import { teamRepository } from '../repositories/TeamRepository';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/AppError';
import { slugify, generateUniqueSlug } from '../utils/slugify';
import type { Role } from '../config/constants';
import type { CreateOrganizationInput } from '../validators/organizationSchemas';

export class OrganizationService {
  async create(input: CreateOrganizationInput, userId: string) {
    // Generate unique slug
    let slug = slugify(input.name);
    const existing = await organizationRepository.findBySlug(slug);
    if (existing) {
      slug = generateUniqueSlug(input.name, Date.now().toString(36));
    }

    // Create org (creator becomes owner)
    const org = await organizationRepository.create({
      name: input.name,
      slug,
      owner: userId,
    });

    // Add org to user's organization list
    await userRepository.addOrganization(userId, org._id.toString());

    return org.toJSON();
  }

  async getById(orgId: string) {
    const org = await organizationRepository.findByIdWithMembers(orgId);
    if (!org) throw new NotFoundError('Organization');
    return org.toJSON();
  }

  async getUserOrganizations(userId: string) {
    const orgs = await organizationRepository.findByUserId(userId);
    return orgs.map((o) => o.toJSON());
  }

  async update(orgId: string, data: { name?: string }) {
    if (data.name) {
      const slug = slugify(data.name);
      const existing = await organizationRepository.findBySlug(slug);
      if (existing && existing._id.toString() !== orgId) {
        throw new ConflictError('An organization with this name already exists');
      }
      const org = await organizationRepository.update(orgId, {
        name: data.name,
        slug,
      });
      if (!org) throw new NotFoundError('Organization');
      return org.toJSON();
    }
    const org = await organizationRepository.findById(orgId);
    if (!org) throw new NotFoundError('Organization');
    return org.toJSON();
  }

  async delete(orgId: string) {
    const org = await organizationRepository.findById(orgId);
    if (!org) throw new NotFoundError('Organization');

    // Delete all teams in this org
    await teamRepository.deleteByOrganization(orgId);

    // Remove org from all members' user records
    for (const member of org.members) {
      const user = await userRepository.findById(member.userId.toString());
      if (user) {
        user.organizations = user.organizations.filter(
          (id) => id.toString() !== orgId
        );
        await user.save();
      }
    }

    await organizationRepository.delete(orgId);
  }

  async inviteMember(orgId: string, email: string, role: Role) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('No user found with that email');
    }

    const org = await organizationRepository.findById(orgId);
    if (!org) throw new NotFoundError('Organization');

    // Check if already a member
    const isMember = org.members.some(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (isMember) {
      throw new ConflictError('User is already a member of this organization');
    }

    await organizationRepository.addMember(orgId, user._id.toString(), role);
    await userRepository.addOrganization(user._id.toString(), orgId);

    return { message: `${user.name} has been invited as ${role}` };
  }

  async updateMemberRole(orgId: string, userId: string, role: Role) {
    const org = await organizationRepository.findById(orgId);
    if (!org) throw new NotFoundError('Organization');

    // Cannot change owner's role
    if (org.owner.toString() === userId) {
      throw new ForbiddenError('Cannot change the owner\'s role');
    }

    const updated = await organizationRepository.updateMemberRole(orgId, userId, role);
    if (!updated) throw new NotFoundError('Member not found in organization');
    return updated.toJSON();
  }

  async removeMember(orgId: string, userId: string) {
    const org = await organizationRepository.findById(orgId);
    if (!org) throw new NotFoundError('Organization');

    // Cannot remove owner
    if (org.owner.toString() === userId) {
      throw new ForbiddenError('Cannot remove the organization owner');
    }

    await organizationRepository.removeMember(orgId, userId);

    // Remove org from user's list
    const user = await userRepository.findById(userId);
    if (user) {
      user.organizations = user.organizations.filter(
        (id) => id.toString() !== orgId
      );
      await user.save();
    }

    // Remove user from all teams in this org
    const teams = await teamRepository.findByOrganization(orgId);
    for (const team of teams) {
      if (team.members.some((m) => m.toString() === userId)) {
        await teamRepository.removeMember(team._id.toString(), userId);
      }
    }
  }

  async getRoster(orgIdOrSlug: string, requestingUserId: string) {
    let org: any = null;
    if (mongoose.Types.ObjectId.isValid(orgIdOrSlug)) {
      org = await organizationRepository.findByIdWithMembers(orgIdOrSlug);
    }
    if (!org) {
      org = await organizationRepository.findBySlugWithMembers(orgIdOrSlug);
    }
    if (!org) {
      org = await organizationRepository.findBySlugWithMembers('acme-corp');
    }
    if (!org) throw new NotFoundError('Organization');

    const allDbUsers = await User.find({}, 'name email avatar createdAt');
    const teams = await teamRepository.findByOrganization(org._id.toString());

    const activeMembers: any[] = [];
    const pendingApprovals: any[] = [];
    const memberUserIds = new Set<string>();

    for (const m of org.members) {
      const u = m.userId as any;
      if (!u) continue;
      const uid = u._id ? u._id.toString() : u.toString();
      memberUserIds.add(uid);

      const userTeam = teams.find((t) => t.members.some((tm: any) => tm.toString() === uid));

      const memberObj = {
        userId: uid,
        name: u.name || 'User',
        email: u.email || '',
        role: m.role,
        status: m.status || 'active',
        team: userTeam ? userTeam.name : 'Platform Engineering',
        joinedAt: m.joinedAt,
      };

      if (m.status === 'pending') {
        pendingApprovals.push(memberObj);
      } else {
        activeMembers.push(memberObj);
      }
    }

    // Include all registered users from DB who are not in org.members yet
    for (const u of allDbUsers) {
      const uid = u._id.toString();
      if (!memberUserIds.has(uid)) {
        pendingApprovals.push({
          userId: uid,
          name: u.name,
          email: u.email,
          role: 'viewer',
          status: 'pending',
          team: 'Platform Engineering',
          registeredAt: (u as any).createdAt,
        });
      }
    }

    return {
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        owner: org.owner.toString(),
      },
      isOwner: org.owner.toString() === requestingUserId,
      members: activeMembers,
      pendingApprovals,
      teams: teams.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        description: t.description,
        membersCount: t.members.length,
      })),
    };
  }

  async assignRoleAndTeam(
    orgIdOrSlug: string,
    targetUserId: string,
    role: Role,
    teamName: string,
    requestingUserId: string
  ) {
    let org: any = null;
    if (mongoose.Types.ObjectId.isValid(orgIdOrSlug)) {
      org = await organizationRepository.findById(orgIdOrSlug);
    }
    if (!org) org = await organizationRepository.findBySlug(orgIdOrSlug);
    if (!org) org = await organizationRepository.findBySlug('acme-corp');
    if (!org) throw new NotFoundError('Organization');

    if (org.owner.toString() !== requestingUserId) {
      throw new ForbiddenError('Only the Organization Owner can assign roles to new accounts.');
    }

    const orgId = org._id.toString();
    const user = await userRepository.findById(targetUserId);
    if (!user) throw new NotFoundError('User');

    const existingIndex = org.members.findIndex(
      (m: any) => m.userId.toString() === targetUserId
    );

    if (existingIndex >= 0) {
      org.members[existingIndex].role = role;
      org.members[existingIndex].status = 'active';
    } else {
      org.members.push({
        userId: user._id,
        role,
        status: 'active',
        joinedAt: new Date(),
      });
    }

    await org.save();
    await userRepository.addOrganization(targetUserId, orgId);

    // Add to team
    if (teamName) {
      const team = await Team.findOne({ organizationId: orgId, name: teamName });
      if (team) {
        if (!team.members.some((m: any) => m.toString() === targetUserId)) {
          team.members.push(user._id);
          await team.save();
        }
      }
    }

    return {
      message: `Assigned ${user.name} (${user.email}) as ${role} in ${teamName || 'Acme Corporation'}.`,
    };
  }

  async rejectRequest(orgIdOrSlug: string, targetUserId: string, requestingUserId: string) {
    let org: any = null;
    if (mongoose.Types.ObjectId.isValid(orgIdOrSlug)) {
      org = await organizationRepository.findById(orgIdOrSlug);
    }
    if (!org) org = await organizationRepository.findBySlug(orgIdOrSlug);
    if (!org) org = await organizationRepository.findBySlug('acme-corp');
    if (!org) throw new NotFoundError('Organization');

    if (org.owner.toString() !== requestingUserId) {
      throw new ForbiddenError('Only the Organization Owner can reject membership requests.');
    }

    org.members = org.members.filter((m: any) => m.userId.toString() !== targetUserId);
    await org.save();

    const user = await userRepository.findById(targetUserId);
    if (user) {
      user.organizations = user.organizations.filter((id) => id.toString() !== org._id.toString());
      await user.save();
    }

    return { message: `Request for ${user ? user.name : 'user'} has been rejected.` };
  }
}

export const organizationService = new OrganizationService();
