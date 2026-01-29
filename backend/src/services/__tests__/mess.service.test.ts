import mongoose from 'mongoose';
import messService from '../mess.service';
import authService from '../auth.service';
import User from '../../models/User';
import Mess from '../../models/Mess';
import InviteLink from '../../models/InviteLink';

describe('MessService', () => {
  let testUserId: string;
  let testUser2Id: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate-test');
    }
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Mess.deleteMany({});
    await InviteLink.deleteMany({});

    // Create test users
    const user1 = await authService.register({
      name: 'Test User 1',
      email: 'test1@example.com',
      password: 'Test123!',
    });
    testUserId = user1.user.id;

    const user2 = await authService.register({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'Test123!',
    });
    testUser2Id = user2.user.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('createMess', () => {
    it('should create a mess with owner assignment and invite code', async () => {
      const messData = {
        name: 'Test Mess',
        memberLimit: 10,
        description: 'Test description',
      };

      const mess = await messService.createMess(testUserId, messData);

      expect(mess).toBeDefined();
      expect(mess.name).toBe(messData.name);
      expect(mess.memberLimit).toBe(messData.memberLimit);
      expect(mess.description).toBe(messData.description);
      expect(mess.inviteCode).toBeDefined();
      expect(mess.inviteCode).toHaveLength(8);
      expect(mess.members).toHaveLength(1);
      expect(mess.members[0].userId).toBe(testUserId);
      expect(mess.members[0].role).toBe('Owner');
    });

    it('should reject member limit below 6', async () => {
      const messData = {
        name: 'Test Mess',
        memberLimit: 5,
      };

      await expect(messService.createMess(testUserId, messData)).rejects.toThrow(
        'Member limit must be between 6 and 20'
      );
    });

    it('should reject member limit above 20', async () => {
      const messData = {
        name: 'Test Mess',
        memberLimit: 21,
      };

      await expect(messService.createMess(testUserId, messData)).rejects.toThrow(
        'Member limit must be between 6 and 20'
      );
    });
  });

  describe('updateMess', () => {
    it('should update mess details when user is owner', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Original Name',
        memberLimit: 10,
      });

      const updated = await messService.updateMess(mess.id, testUserId, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
    });

    it('should reject update when user is not owner', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await expect(
        messService.updateMess(mess.id, testUser2Id, { name: 'Hacked Name' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject member limit below current member count', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      // Add another member
      await messService.joinMessByCode(testUser2Id, mess.inviteCode);

      // Try to set limit to 1 (below current count of 2)
      await expect(
        messService.updateMess(mess.id, testUserId, { memberLimit: 1 })
      ).rejects.toThrow('Cannot set member limit below current member count');
    });
  });

  describe('getMess', () => {
    it('should return mess details for member', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      const retrieved = await messService.getMess(mess.id, testUserId);

      expect(retrieved.id).toBe(mess.id);
      expect(retrieved.name).toBe(mess.name);
    });

    it('should reject non-member access', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await expect(messService.getMess(mess.id, testUser2Id)).rejects.toThrow(
        'Unauthorized: User is not a member of this mess'
      );
    });
  });

  describe('getUserMesses', () => {
    it('should return all messes for a user', async () => {
      await messService.createMess(testUserId, {
        name: 'Mess 1',
        memberLimit: 10,
      });

      await messService.createMess(testUserId, {
        name: 'Mess 2',
        memberLimit: 8,
      });

      const messes = await messService.getUserMesses(testUserId);

      expect(messes).toHaveLength(2);
      expect(messes.map((m) => m.name)).toContain('Mess 1');
      expect(messes.map((m) => m.name)).toContain('Mess 2');
    });

    it('should return empty array for user with no messes', async () => {
      const messes = await messService.getUserMesses(testUser2Id);
      expect(messes).toHaveLength(0);
    });
  });

  describe('generateInviteLink', () => {
    it('should generate invite link with expiration', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      const inviteLink = await messService.generateInviteLink(mess.id, testUserId, 24);

      expect(inviteLink.inviteLink).toBeDefined();
      expect(inviteLink.inviteLink).toContain('/join/');
      expect(inviteLink.expiresAt).toBeInstanceOf(Date);
      expect(inviteLink.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject non-owner generating invite link', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await expect(
        messService.generateInviteLink(mess.id, testUser2Id, 24)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('joinMessByCode', () => {
    it('should allow user to join mess with valid invite code', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      const joined = await messService.joinMessByCode(testUser2Id, mess.inviteCode);

      expect(joined.members).toHaveLength(2);
      expect(joined.members.find((m) => m.userId === testUser2Id)?.role).toBe('Member');
    });

    it('should reject invalid invite code', async () => {
      await expect(messService.joinMessByCode(testUser2Id, 'INVALID1')).rejects.toThrow(
        'Invalid invite code'
      );
    });

    it('should prevent duplicate membership', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await messService.joinMessByCode(testUser2Id, mess.inviteCode);

      await expect(messService.joinMessByCode(testUser2Id, mess.inviteCode)).rejects.toThrow(
        'User is already a member of this mess'
      );
    });

    it('should reject joining when mess is at capacity', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 6,
      });

      // Create 5 more users and add them (total will be 6)
      for (let i = 0; i < 5; i++) {
        const user = await authService.register({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'Test123!',
        });
        await messService.joinMessByCode(user.user.id, mess.inviteCode);
      }

      // Try to add one more (should fail)
      await expect(messService.joinMessByCode(testUser2Id, mess.inviteCode)).rejects.toThrow(
        'Mess has reached maximum capacity'
      );
    });
  });

  describe('joinMessByLink', () => {
    it('should allow user to join mess with valid invite link token', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      const inviteLink = await messService.generateInviteLink(mess.id, testUserId, 24);
      const token = inviteLink.inviteLink.split('/join/')[1];

      const joined = await messService.joinMessByLink(testUser2Id, token);

      expect(joined.members).toHaveLength(2);
      expect(joined.members.find((m) => m.userId === testUser2Id)?.role).toBe('Member');
    });

    it('should reject invalid token', async () => {
      await expect(messService.joinMessByLink(testUser2Id, 'invalid-token')).rejects.toThrow(
        'Invalid or expired invite link'
      );
    });
  });

  describe('removeMember', () => {
    it('should allow owner to remove member', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await messService.joinMessByCode(testUser2Id, mess.inviteCode);

      await messService.removeMember(mess.id, testUserId, testUser2Id);

      const updated = await messService.getMess(mess.id, testUserId);
      expect(updated.members).toHaveLength(1);
      expect(updated.members.find((m) => m.userId === testUser2Id)).toBeUndefined();
    });

    it('should reject non-owner removing member', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await messService.joinMessByCode(testUser2Id, mess.inviteCode);

      await expect(
        messService.removeMember(mess.id, testUser2Id, testUserId)
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject removing the owner', async () => {
      const mess = await messService.createMess(testUserId, {
        name: 'Test Mess',
        memberLimit: 10,
      });

      await expect(messService.removeMember(mess.id, testUserId, testUserId)).rejects.toThrow(
        'Cannot remove the mess owner'
      );
    });
  });
});
