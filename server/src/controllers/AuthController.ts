import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { ApiResponse } from '../utils/ApiResponse';
import { env } from '../config/env';

/**
 * AuthController handles HTTP request/response for authentication endpoints.
 *
 * Architecture: Controllers are thin — they extract data from the request,
 * call the service, and format the response. Business logic lives in AuthService.
 */

// ─── Cookie options for refresh token ────────────────────────────────────────

const REFRESH_TOKEN_COOKIE = 'dv_refresh_token';

const cookieOptions = {
  httpOnly: true,          // Not accessible via JavaScript (XSS protection)
  secure: env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const,
  path: '/api/v1/auth',    // Only sent to auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);

    // Set refresh token in HTTP-only cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

    ApiResponse.success({
      res,
      statusCode: 201,
      message: 'Account created successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

    ApiResponse.success({
      res,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const userId = req.user?.userId;

    if (userId && refreshToken) {
      await authService.logout(userId, refreshToken);
    }

    // Clear the cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });

    ApiResponse.success({
      res,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh Token ───────────────────────────────────────────────────────────

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!token) {
      ApiResponse.error({
        res,
        statusCode: 401,
        message: 'No refresh token provided',
      });
      return;
    }

    const result = await authService.refreshAccessToken(token);

    // Set the new rotated refresh token
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

    ApiResponse.success({
      res,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    // Clear cookie on failure
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });
    next(err);
  }
}

// ─── Forgot Password ────────────────────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const message = await authService.forgotPassword(req.body.email);
    ApiResponse.success({ res, message });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password ─────────────────────────────────────────────────────────

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resetPassword(req.body.token, req.body.password);

    // Clear cookie since all sessions were invalidated
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });

    ApiResponse.success({
      res,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Current User ────────────────────────────────────────────────────────

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await authService.getProfile(userId);

    ApiResponse.success({
      res,
      message: 'User profile retrieved',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
