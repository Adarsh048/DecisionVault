import { User, IUser } from '../models/User';
import type { FilterQuery, UpdateQuery } from 'mongoose';

/**
 * UserRepository abstracts all MongoDB operations for the User collection.
 *
 * Architecture: Repository pattern separates database operations from business
 * logic (services). This makes the code testable — you can mock the repository
 * in service unit tests without touching MongoDB.
 */
export class UserRepository {
  async create(data: { name: string; email: string; password: string }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  /**
   * Find a user by email and include the password field.
   * Used only during login — password is `select: false` by default.
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  /**
   * Find a user by ID and include refresh tokens.
   * Used only during token refresh — refreshTokens is `select: false` by default.
   */
  async findByIdWithRefreshTokens(id: string): Promise<IUser | null> {
    return User.findById(id).select('+refreshTokens');
  }

  /**
   * Find a user by password reset token (unhashed, matched in DB).
   */
  async findByResetToken(token: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');
  }

  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  /**
   * Add a hashed refresh token to the user's token array.
   * Limits to 5 concurrent refresh tokens (prunes oldest).
   */
  async addRefreshToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date
  ): Promise<void> {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    // Keep only the 4 most recent tokens + add new one (max 5)
    const validTokens = user.refreshTokens
      .filter((t) => t.expiresAt > new Date())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4);

    user.refreshTokens = [
      ...validTokens,
      { token: hashedToken, expiresAt, createdAt: new Date() },
    ];

    await user.save();
  }

  /**
   * Remove a specific refresh token from the user's token array.
   */
  async removeRefreshToken(userId: string, hashedToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: hashedToken } },
    });
  }

  /**
   * Remove all refresh tokens for a user (logout from all devices).
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });
  }

  /**
   * Set the password reset token and expiry.
   */
  async setPasswordResetToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
  }

  /**
   * Clear the password reset token after successful reset.
   */
  async clearPasswordResetToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
    });
  }

  /**
   * Add an organization to the user's list.
   */
  async addOrganization(userId: string, orgId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { organizations: orgId },
    });
  }

  /**
   * Find multiple users by their IDs.
   */
  async findByIds(ids: string[]): Promise<IUser[]> {
    return User.find({ _id: { $in: ids } });
  }

  /**
   * Search users by name or email (for member invitation autocomplete).
   */
  async searchUsers(query: string, limit = 10): Promise<IUser[]> {
    const regex = new RegExp(query, 'i');
    return User.find({
      $or: [{ name: regex }, { email: regex }],
    }).limit(limit);
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
