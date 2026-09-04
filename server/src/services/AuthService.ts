import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/UserRepository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/AppError';
import { env } from '../config/env';
import type { IUser } from '../models/User';
import type { RegisterInput, LoginInput } from '../validators/authSchemas';

/**
 * AuthService encapsulates all authentication business logic.
 *
 * Key design decisions:
 * 1. Refresh tokens are hashed before storage (like passwords).
 * 2. Token rotation: each refresh gives a new refresh token and invalidates the old one.
 * 3. Password reset uses a random hex token stored in the DB with an expiry.
 */
import { Organization } from '../models/Organization';

export class AuthService {
  /**
   * Register a new user.
   * Returns user data and tokens.
   */
  async register(input: RegisterInput) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Create user (password is hashed by the pre-save hook)
    const user = await userRepository.create(input);

    // Auto-enroll new user in the workspace as a pending member awaiting Owner approval
    try {
      const defaultOrg = await Organization.findOne({ slug: 'acme-corp' });
      if (defaultOrg) {
        defaultOrg.members.push({
          userId: user._id,
          role: 'viewer',
          status: 'pending',
          joinedAt: new Date(),
        });
        await defaultOrg.save();
        await userRepository.addOrganization(user._id.toString(), defaultOrg._id.toString());
      }
    } catch {
      // Organization enrollment fallback should not crash registration
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with email and password.
   */
  async login(input: LoginInput) {
    // Find user with password field included
    const user = await userRepository.findByEmailWithPassword(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Compare password
    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout — invalidate the refresh token.
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    await userRepository.removeRefreshToken(userId, hashedToken);
  }

  /**
   * Refresh access token using a valid refresh token.
   * Implements token rotation: old refresh token is invalidated, new one is issued.
   */
  async refreshAccessToken(refreshToken: string) {
    // 1. Verify the refresh token JWT
    const payload = verifyRefreshToken(refreshToken);

    // 2. Find user with refresh tokens
    const user = await userRepository.findByIdWithRefreshTokens(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // 3. Check if this refresh token exists in the user's stored tokens
    const hashedToken = this.hashToken(refreshToken);
    const storedToken = user.refreshTokens.find((t) => t.token === hashedToken);
    if (!storedToken) {
      // Token reuse detected — possible theft. Invalidate all tokens.
      await userRepository.removeAllRefreshTokens(user._id.toString());
      throw new UnauthorizedError('Invalid refresh token. All sessions have been revoked for security.');
    }

    // 4. Check expiry
    if (storedToken.expiresAt < new Date()) {
      await userRepository.removeRefreshToken(user._id.toString(), hashedToken);
      throw new UnauthorizedError('Refresh token expired');
    }

    // 5. Remove old token
    await userRepository.removeRefreshToken(user._id.toString(), hashedToken);

    // 6. Generate new token pair (rotation)
    const tokens = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Initiate password reset — generate token and log to console.
   * In production, this would send an email.
   */
  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists — return success either way
      return 'If an account with that email exists, a password reset link has been sent.';
    }

    // Generate reset token (unhashed version sent to user, hashed version stored)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.setPasswordResetToken(
      user._id.toString(),
      hashedResetToken,
      expires
    );

    // Log reset token to console (dev mode)
    console.log('──────────────────────────────────────────────');
    console.log(`Password Reset Token for ${email}:`);
    console.log(resetToken);
    console.log(`Reset URL: ${env.CLIENT_URL}/reset-password?token=${resetToken}`);
    console.log('──────────────────────────────────────────────');

    return 'If an account with that email exists, a password reset link has been sent.';
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the token to match what's stored
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await userRepository.findByResetToken(hashedToken);
    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Clear reset token
    await userRepository.clearPasswordResetToken(user._id.toString());

    // Invalidate all refresh tokens (force re-login)
    await userRepository.removeAllRefreshTokens(user._id.toString());
  }

  /**
   * Get current user profile.
   */
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user.toJSON();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Generate access + refresh tokens and store the refresh token.
   */
  private async generateTokens(user: IUser) {
    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Hash and store the refresh token
    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.parseExpiry(env.REFRESH_TOKEN_EXPIRES_IN));
    await userRepository.addRefreshToken(user._id.toString(), hashedRefreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  /**
   * Hash a token using SHA-256.
   * We hash refresh tokens before storing them (like passwords) so a DB leak
   * doesn't compromise active sessions.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse a time string like "7d" or "15m" to milliseconds.
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    const [, value, unit] = match;
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return parseInt(value) * (multipliers[unit] || 1);
  }
}

// Export singleton
export const authService = new AuthService();
