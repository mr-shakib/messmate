import mongoose from 'mongoose';
import activityLogService from '../activityLog.service';
import messService from '../mess.service';
import authService from '../auth.service';
import User from '../../models/User';
import Mess from '../../models/Mess';
import ActivityLog from '../../models/ActivityLog';

describe('ActivityLogService', () => {
  let testUserId: string;
  let testUser2Id: string;
  let adminUserId: string;
  let messId: string;

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
    await ActivityLog.deleteMany({});

    // Create test users
    const user1 = await authService.register({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'Test123!',
    });
    testUserId = user1.user.id;

    const user2 = await authService.register({
      name: 'Member User',
      email: 'member@example.com',
      password: 'Test123!',
    });
    testUser2Id = user2.user.id;

    const user3 = await authService.register({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Test123!',
    });
    adminUserId = user3.user.id;

    // Create a mess
    const mess = await messService.createMess(testUserId, {
      name: 'Test Mess',
      memberLimit: 10,
    });
    messId = mess.id;

    // Add member and admin
    await messService.joinMessByCode(testUser2Id, mess.inviteCode);
    await messService.joinMessByCode(adminUserId, mess.inviteCode);

    // Promote admin user to Admin role
    const messDoc = await Mess.findById(messId);
    if (messDoc) {
      const adminMember = messDoc.members.find((m) =>
        m.userId.equals(new mongoose.Types.ObjectId(adminUserId))
      );
      if (adminMember) {
        adminMember.role = 'Admin';
        await messDoc.save();
      }
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('logExpenseActivity', () => {
    it('should log expense creation activity', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();

      await activityLogService.logExpenseActivity(
        messId,
        testUserId,
        'created',
        expenseId,
        { amount: 100, description: 'Test expense' }
      );

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('created');
      expect(logs[0].activityType).toBe('expense');
      expect(logs[0].resourceId?.toString()).toBe(expenseId);
      expect(logs[0].details.amount).toBe(100);
    });

    it('should log expense update activity', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();

      await activityLogService.logExpenseActivity(
        messId,
        testUserId,
        'updated',
        expenseId,
        { oldAmount: 100, newAmount: 150 }
      );

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('updated');
    });

    it('should log expense deletion activity', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();

      await activityLogService.logExpenseActivity(
        messId,
        testUserId,
        'deleted',
        expenseId,
        { reason: 'Duplicate entry' }
      );

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('deleted');
    });

    it('should reject invalid action', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();

      await expect(
        activityLogService.logExpenseActivity(
          messId,
          testUserId,
          'invalid' as any,
          expenseId,
          {}
        )
      ).rejects.toThrow('Invalid action for expense activity');
    });
  });

  describe('logSettlementActivity', () => {
    it('should log settlement creation activity', async () => {
      const settlementId = new mongoose.Types.ObjectId().toString();

      await activityLogService.logSettlementActivity(messId, testUserId, settlementId, {
        fromUser: testUser2Id,
        toUser: testUserId,
        amount: 50,
      });

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('created');
      expect(logs[0].activityType).toBe('settlement');
      expect(logs[0].resourceId?.toString()).toBe(settlementId);
    });
  });

  describe('logMemberActivity', () => {
    it('should log member joined activity', async () => {
      await activityLogService.logMemberActivity(messId, 'joined', testUser2Id, {
        inviteMethod: 'code',
      });

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('joined');
      expect(logs[0].activityType).toBe('member');
    });

    it('should log member left activity', async () => {
      await activityLogService.logMemberActivity(messId, 'left', testUser2Id, {
        reason: 'User request',
      });

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('left');
    });

    it('should log role changed activity', async () => {
      await activityLogService.logMemberActivity(messId, 'role_changed', testUser2Id, {
        oldRole: 'Member',
        newRole: 'Admin',
      });

      const logs = await ActivityLog.find({ messId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('role_changed');
    });

    it('should reject invalid action', async () => {
      await expect(
        activityLogService.logMemberActivity(messId, 'invalid' as any, testUser2Id, {})
      ).rejects.toThrow('Invalid action for member activity');
    });
  });

  describe('getActivityLogs', () => {
    beforeEach(async () => {
      // Create some test logs
      const expenseId = new mongoose.Types.ObjectId().toString();
      const settlementId = new mongoose.Types.ObjectId().toString();

      await activityLogService.logExpenseActivity(
        messId,
        testUserId,
        'created',
        expenseId,
        {}
      );
      await activityLogService.logSettlementActivity(messId, testUserId, settlementId, {});
      await activityLogService.logMemberActivity(messId, 'joined', testUser2Id, {});
    });

    it('should return all logs for owner', async () => {
      const result = await activityLogService.getActivityLogs(messId, testUserId);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.totalItems).toBe(3);
    });

    it('should return only expense and settlement logs for admin', async () => {
      const result = await activityLogService.getActivityLogs(messId, adminUserId);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((log) => ['expense', 'settlement'].includes(log.activityType))).toBe(
        true
      );
    });

    it('should reject member access', async () => {
      await expect(
        activityLogService.getActivityLogs(messId, testUser2Id)
      ).rejects.toThrow('Unauthorized: Members cannot view activity logs');
    });

    it('should filter by activity type', async () => {
      const result = await activityLogService.getActivityLogs(messId, testUserId, {
        activityType: 'expense',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].activityType).toBe('expense');
    });

    it('should reject admin viewing member activities', async () => {
      await expect(
        activityLogService.getActivityLogs(messId, adminUserId, {
          activityType: 'member',
        })
      ).rejects.toThrow('Unauthorized: Admins cannot view member activities');
    });

    it('should support pagination', async () => {
      // Create more logs
      for (let i = 0; i < 10; i++) {
        const expenseId = new mongoose.Types.ObjectId().toString();
        await activityLogService.logExpenseActivity(
          messId,
          testUserId,
          'created',
          expenseId,
          {}
        );
      }

      const result = await activityLogService.getActivityLogs(messId, testUserId, {
        page: 1,
        limit: 5,
      });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBeGreaterThan(1);
    });

    it('should filter by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await activityLogService.getActivityLogs(messId, testUserId, {
        startDate: yesterday,
        endDate: tomorrow,
      });

      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should include user names in response', async () => {
      const result = await activityLogService.getActivityLogs(messId, testUserId);

      expect(result.data[0].userName).toBeDefined();
      expect(result.data[0].userName).not.toBe('Unknown');
    });
  });
});
