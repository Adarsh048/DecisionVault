import { Organization, IOrganization } from '../models/Organization';
import type { Role } from '../config/constants';

export class OrganizationRepository {
  async create(data: {
    name: string;
    slug: string;
    owner: string;
  }): Promise<IOrganization> {
    const org = new Organization({
      ...data,
      members: [{ userId: data.owner, role: 'owner', joinedAt: new Date() }],
    });
    return org.save();
  }

  async findById(id: string): Promise<IOrganization | null> {
    return Organization.findById(id);
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    return Organization.findOne({ slug });
  }

  /**
   * Find all organizations a user belongs to.
   */
  async findByUserId(userId: string): Promise<IOrganization[]> {
    return Organization.find({ 'members.userId': userId });
  }

  async update(
    id: string,
    data: Partial<Pick<IOrganization, 'name' | 'slug'>>
  ): Promise<IOrganization | null> {
    return Organization.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string): Promise<void> {
    await Organization.findByIdAndDelete(id);
  }

  /**
   * Add a member to the organization.
   */
  async addMember(
    orgId: string,
    userId: string,
    role: Role
  ): Promise<IOrganization | null> {
    return Organization.findByIdAndUpdate(
      orgId,
      {
        $push: {
          members: { userId, role, joinedAt: new Date() },
        },
      },
      { new: true }
    );
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    role: Role
  ): Promise<IOrganization | null> {
    return Organization.findOneAndUpdate(
      { _id: orgId, 'members.userId': userId },
      { $set: { 'members.$.role': role } },
      { new: true }
    );
  }

  /**
   * Remove a member from the organization.
   */
  async removeMember(
    orgId: string,
    userId: string
  ): Promise<IOrganization | null> {
    return Organization.findByIdAndUpdate(
      orgId,
      { $pull: { members: { userId } } },
      { new: true }
    );
  }

  /**
   * Check if a user is a member and return their role.
   */
  async getMemberRole(
    orgId: string,
    userId: string
  ): Promise<Role | null> {
    const org = await Organization.findOne(
      { _id: orgId, 'members.userId': userId },
      { 'members.$': 1 }
    );
    if (!org || !org.members.length) return null;
    return org.members[0].role as Role;
  }

  /**
   * Update a member's role and approval status.
   */
  async updateMemberStatusAndRole(
    orgId: string,
    userId: string,
    role: Role,
    status: 'active' | 'pending' = 'active'
  ): Promise<IOrganization | null> {
    return Organization.findOneAndUpdate(
      { _id: orgId, 'members.userId': userId },
      { $set: { 'members.$.role': role, 'members.$.status': status } },
      { new: true }
    );
  }

  /**
   * Get organization with populated member user details by ID.
   */
  async findByIdWithMembers(id: string): Promise<IOrganization | null> {
    return Organization.findById(id).populate(
      'members.userId',
      'name email avatar createdAt'
    );
  }

  /**
   * Get organization with populated member user details by Slug.
   */
  async findBySlugWithMembers(slug: string): Promise<IOrganization | null> {
    return Organization.findOne({ slug }).populate(
      'members.userId',
      'name email avatar createdAt'
    );
  }
}

export const organizationRepository = new OrganizationRepository();
