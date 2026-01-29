import authService from '../auth.service';
import User from '../../models/User';

// Mock the User model
jest.mock('../../models/User');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
        addRefreshToken: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as any).mockImplementation(() => mockUser);

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject registration with weak password', async () => {
      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak',
        })
      ).rejects.toThrow('Password validation failed');
    });

    it('should reject registration with password missing uppercase', async () => {
      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'test123!',
        })
      ).rejects.toThrow('Password validation failed');
    });

    it('should reject registration with password missing lowercase', async () => {
      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TEST123!',
        })
      ).rejects.toThrow('Password validation failed');
    });

    it('should reject registration with password missing number', async () => {
      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestTest!',
        })
      ).rejects.toThrow('Password validation failed');
    });

    it('should reject registration with existing email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123!',
        })
      ).rejects.toThrow('already exists');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        addRefreshToken: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Test123!',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Test123!');
    });

    it('should reject login with invalid email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Test123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should remove refresh token on logout', async () => {
      const mockUser = {
        removeRefreshToken: jest.fn().mockResolvedValue(true),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authService.logout('user123', 'refresh-token');

      expect(mockUser.removeRefreshToken).toHaveBeenCalledWith('refresh-token');
    });

    it('should throw error if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.logout('nonexistent', 'refresh-token')
      ).rejects.toThrow('User not found');
    });
  });

  describe('revokeAllTokens', () => {
    it('should remove all refresh tokens', async () => {
      const mockUser = {
        removeAllRefreshTokens: jest.fn().mockResolvedValue(true),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authService.revokeAllTokens('user123');

      expect(mockUser.removeAllRefreshTokens).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.revokeAllTokens('nonexistent')
      ).rejects.toThrow('User not found');
    });
  });
});
