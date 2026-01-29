import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

// Payload interface for JWT tokens
export interface JWTPayload {
  userId: string;
  email: string;
}

// Interface for decoded token
export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
}

/**
 * Generate an access token with 15-minute expiry
 * @param payload - User information to encode in the token
 * @returns Signed JWT access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiry,
  } as SignOptions);
};

/**
 * Generate a refresh token with 7-day expiry
 * @param payload - User information to encode in the token
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiry,
  } as SignOptions);
};

/**
 * Verify and decode an access token
 * @param token - JWT access token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, env.jwtAccessSecret) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Calculate expiration date for refresh token
 * @returns Date object representing when the refresh token expires
 */
export const getRefreshTokenExpiry = (): Date => {
  // Parse the expiry string (e.g., "7d") and convert to milliseconds
  const expiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return new Date(Date.now() + expiryMs);
};
