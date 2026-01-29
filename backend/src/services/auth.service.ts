import User, { IUser } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
  JWTPayload,
} from '../utils/jwt';
import {
  createValidationError,
  createDuplicateError,
  createInvalidCredentialsError,
  createInvalidTokenError,
  createNotFoundError,
} from '../utils/errors';

// DTOs (Data Transfer Objects)
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService handles user authentication operations
 */
class AuthService {
  /**
   * Register a new user with password validation and hashing
   * @param userData - User registration data
   * @returns User information and authentication tokens
   * @throws Error if email already exists or validation fails
   */
  async register(userData: RegisterDTO): Promise<AuthResponse> {
    const { name, email, password } = userData;

    // Validate password requirements
    this.validatePassword(password);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw createDuplicateError('Email', email);
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in database
    await user.addRefreshToken(refreshToken, getRefreshTokenExpiry());

    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with credential verification and token generation
   * @param credentials - User login credentials
   * @returns User information and authentication tokens
   * @throws Error if credentials are invalid
   */
  async login(credentials: LoginDTO): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw createInvalidCredentialsError();
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createInvalidCredentialsError();
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in database
    await user.addRefreshToken(refreshToken, getRefreshTokenExpiry());

    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using a valid refresh token
   * @param refreshToken - Valid refresh token
   * @returns New access and refresh tokens
   * @throws Error if refresh token is invalid or expired
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw createInvalidTokenError();
    }

    // Find user and verify refresh token exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw createNotFoundError('User');
    }

    // Check if refresh token exists in user's token list
    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!tokenExists) {
      throw createInvalidTokenError();
    }

    // Remove old refresh token
    await user.removeRefreshToken(refreshToken);

    // Generate new tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Store new refresh token
    await user.addRefreshToken(newRefreshToken, getRefreshTokenExpiry());

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by invalidating the refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token to invalidate
   * @throws Error if user not found or token doesn't exist
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User');
    }

    // Remove the specific refresh token
    await user.removeRefreshToken(refreshToken);
  }

  /**
   * Revoke all refresh tokens for a user (security measure)
   * @param userId - User ID
   * @throws Error if user not found
   */
  async revokeAllTokens(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User');
    }

    // Remove all refresh tokens
    await user.removeAllRefreshTokens();
  }

  /**
   * Validate password meets requirements
   * @param password - Password to validate
   * @throws Error if password doesn't meet requirements
   */
  private validatePassword(password: string): void {
    const errors: string[] = [];

    // Minimum 8 characters
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (errors.length > 0) {
      throw createValidationError('Password validation failed', errors);
    }
  }

  /**
   * Format user document to response object (exclude sensitive data)
   * @param user - User document
   * @returns Formatted user response
   */
  private formatUserResponse(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Export singleton instance
export default new AuthService();
