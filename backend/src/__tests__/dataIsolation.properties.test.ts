import mongoose from 'mongoose';
import * as fc from 'fast-check';
import authService from '../services/auth.service';
import messService from '../services/mess.service';
import expenseService from '../services/expense.service';
import settlementService from '../services/settlement.service';
import balanceService from '../services/balance.service';
import User from '../models/User';
import Mess from '../models/Mess';
import Expense from '../models/Expense';
import Settlement from '../models/Settlement';
import { ExpenseCategory, SplitMethod } from '../models/Expense';

/**
 * Property-Based Tests for Data Isolation
 * 
 * Feature: mess-management-system, Property 31: Mess Data Isolation
 * Validates: Requirements 10.3, 10.4
 * 
 * These tests verify that expenses, settlements, and balances from one mess
 * never appear in queries for another mess.
 */

describe('Data Isolation Properties', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate-test'
      );
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
    await Mess.deleteMany({});
    await Expense.deleteMany({});
    await Settlement.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**
   * Property 31: Mess Data Isolation
   * 
   * For any two different messes, expenses, settlements, and balances from one mess
   * should never appear in queries for the other mess.
   */
  describe('Property 31: Mess Data Isolation', () => {
    it(
      'should isolate expenses between different messes',
      async () => {
        await fc.assert(
        fc.asyncProperty(
          // Generate random expense amounts for two messes
          fc.float({ min: 10, max: 1000, noNaN: true }),
          fc.float({ min: 10, max: 1000, noNaN: true }),
          fc.constantFrom<ExpenseCategory>(
            'Groceries',
            'Utilities',
            'Rent',
            'Food',
            'Entertainment',
            'Other'
          ),
          fc.constantFrom<ExpenseCategory>(
            'Groceries',
            'Utilities',
            'Rent',
            'Food',
            'Entertainment',
            'Other'
          ),
          async (amount1Raw, amount2Raw, category1, category2) => {
            // Round amounts to 2 decimal places to match validation
            const amount1 = Math.round(amount1Raw * 100) / 100;
            const amount2 = Math.round(amount2Raw * 100) / 100;
            // Create two separate users for two separate messes
            const user1 = await authService.register({
              name: 'User 1',
              email: `user1-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const user2 = await authService.register({
              name: 'User 2',
              email: `user2-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            // Create two separate messes
            const mess1 = await messService.createMess(user1.user.id, {
              name: 'Mess 1',
              memberLimit: 10,
            });

            const mess2 = await messService.createMess(user2.user.id, {
              name: 'Mess 2',
              memberLimit: 10,
            });

            // Create an expense in mess1
            const expense1 = await expenseService.createExpense(user1.user.id, {
              messId: mess1.id,
              amount: amount1,
              description: 'Expense in Mess 1',
              category: category1,
              date: new Date(),
              paidBy: user1.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            // Create an expense in mess2
            const expense2 = await expenseService.createExpense(user2.user.id, {
              messId: mess2.id,
              amount: amount2,
              description: 'Expense in Mess 2',
              category: category2,
              date: new Date(),
              paidBy: user2.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            // Query expenses for mess1 - should only return expense1
            const mess1Expenses = await expenseService.getExpenses(
              mess1.id,
              user1.user.id,
              {}
            );

            // Query expenses for mess2 - should only return expense2
            const mess2Expenses = await expenseService.getExpenses(
              mess2.id,
              user2.user.id,
              {}
            );

            // Verify isolation: mess1 expenses should not contain expense2
            const mess1ExpenseIds = mess1Expenses.data.map((e) => e.id);
            expect(mess1ExpenseIds).not.toContain(expense2.id);
            expect(mess1ExpenseIds).toContain(expense1.id);
            expect(mess1Expenses.data).toHaveLength(1);

            // Verify isolation: mess2 expenses should not contain expense1
            const mess2ExpenseIds = mess2Expenses.data.map((e) => e.id);
            expect(mess2ExpenseIds).not.toContain(expense1.id);
            expect(mess2ExpenseIds).toContain(expense2.id);
            expect(mess2Expenses.data).toHaveLength(1);
          }
        ),
        { numRuns: 10 }
      );
    },
    20000
  ); // 20 second timeout for property-based test

    it(
      'should isolate settlements between different messes',
      async () => {
        await fc.assert(
        fc.asyncProperty(
          // Generate random settlement amounts
          fc.float({ min: 10, max: 500, noNaN: true }),
          fc.float({ min: 10, max: 500, noNaN: true }),
          async (settlementAmount1Raw, settlementAmount2Raw) => {
            // Round amounts to 2 decimal places to match validation
            const settlementAmount1 = Math.round(settlementAmount1Raw * 100) / 100;
            const settlementAmount2 = Math.round(settlementAmount2Raw * 100) / 100;
            // Create users for two separate messes
            const owner1 = await authService.register({
              name: 'Owner 1',
              email: `owner1-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const member1 = await authService.register({
              name: 'Member 1',
              email: `member1-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const owner2 = await authService.register({
              name: 'Owner 2',
              email: `owner2-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const member2 = await authService.register({
              name: 'Member 2',
              email: `member2-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            // Create two separate messes
            const mess1 = await messService.createMess(owner1.user.id, {
              name: 'Mess 1',
              memberLimit: 10,
            });

            const mess2 = await messService.createMess(owner2.user.id, {
              name: 'Mess 2',
              memberLimit: 10,
            });

            // Add members to messes
            await messService.joinMessByCode(member1.user.id, mess1.inviteCode);
            await messService.joinMessByCode(member2.user.id, mess2.inviteCode);

            // Create expenses to establish balances
            await expenseService.createExpense(owner1.user.id, {
              messId: mess1.id,
              amount: settlementAmount1 * 2,
              description: 'Expense in Mess 1',
              category: 'Groceries',
              date: new Date(),
              paidBy: owner1.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            await expenseService.createExpense(owner2.user.id, {
              messId: mess2.id,
              amount: settlementAmount2 * 2,
              description: 'Expense in Mess 2',
              category: 'Groceries',
              date: new Date(),
              paidBy: owner2.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            // Record settlements in both messes
            const settlement1 = await settlementService.recordSettlement(
              member1.user.id,
              {
                messId: mess1.id,
                fromUserId: member1.user.id,
                toUserId: owner1.user.id,
                amount: settlementAmount1,
                description: 'Settlement in Mess 1',
              }
            );

            const settlement2 = await settlementService.recordSettlement(
              member2.user.id,
              {
                messId: mess2.id,
                fromUserId: member2.user.id,
                toUserId: owner2.user.id,
                amount: settlementAmount2,
                description: 'Settlement in Mess 2',
              }
            );

            // Query settlements for mess1 - should only return settlement1
            const mess1Settlements = await settlementService.getSettlements(
              mess1.id,
              owner1.user.id,
              {}
            );

            // Query settlements for mess2 - should only return settlement2
            const mess2Settlements = await settlementService.getSettlements(
              mess2.id,
              owner2.user.id,
              {}
            );

            // Verify isolation: mess1 settlements should not contain settlement2
            const mess1SettlementIds = mess1Settlements.data.map((s) => s.id);
            expect(mess1SettlementIds).not.toContain(settlement2.id);
            expect(mess1SettlementIds).toContain(settlement1.id);
            expect(mess1Settlements.data).toHaveLength(1);

            // Verify isolation: mess2 settlements should not contain settlement1
            const mess2SettlementIds = mess2Settlements.data.map((s) => s.id);
            expect(mess2SettlementIds).not.toContain(settlement1.id);
            expect(mess2SettlementIds).toContain(settlement2.id);
            expect(mess2Settlements.data).toHaveLength(1);
          }
        ),
        { numRuns: 5 }
      );
    },
    20000
  ); // 20 second timeout for property-based test

    it(
      'should isolate balances between different messes',
      async () => {
        await fc.assert(
        fc.asyncProperty(
          // Generate random expense amounts
          fc.float({ min: 100, max: 1000, noNaN: true }),
          fc.float({ min: 100, max: 1000, noNaN: true }),
          async (expenseAmount1Raw, expenseAmount2Raw) => {
            // Round amounts to 2 decimal places to match validation
            const expenseAmount1 = Math.round(expenseAmount1Raw * 100) / 100;
            const expenseAmount2 = Math.round(expenseAmount2Raw * 100) / 100;
            // Create users for two separate messes
            const owner1 = await authService.register({
              name: 'Owner 1',
              email: `owner1-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const member1 = await authService.register({
              name: 'Member 1',
              email: `member1-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const owner2 = await authService.register({
              name: 'Owner 2',
              email: `owner2-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const member2 = await authService.register({
              name: 'Member 2',
              email: `member2-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            // Create two separate messes
            const mess1 = await messService.createMess(owner1.user.id, {
              name: 'Mess 1',
              memberLimit: 10,
            });

            const mess2 = await messService.createMess(owner2.user.id, {
              name: 'Mess 2',
              memberLimit: 10,
            });

            // Add members to messes
            await messService.joinMessByCode(member1.user.id, mess1.inviteCode);
            await messService.joinMessByCode(member2.user.id, mess2.inviteCode);

            // Create expenses in both messes
            await expenseService.createExpense(owner1.user.id, {
              messId: mess1.id,
              amount: expenseAmount1,
              description: 'Expense in Mess 1',
              category: 'Groceries',
              date: new Date(),
              paidBy: owner1.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            await expenseService.createExpense(owner2.user.id, {
              messId: mess2.id,
              amount: expenseAmount2,
              description: 'Expense in Mess 2',
              category: 'Groceries',
              date: new Date(),
              paidBy: owner2.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            // Calculate balances for member1 in mess1
            const member1BalanceInMess1 = await balanceService.calculateMemberBalance(
              mess1.id,
              member1.user.id
            );

            // Calculate balances for member2 in mess2
            const member2BalanceInMess2 = await balanceService.calculateMemberBalance(
              mess2.id,
              member2.user.id
            );

            // Verify that member1's balance in mess1 is based only on mess1 expenses
            // Member1 should owe half of expenseAmount1 (since it's split equally between 2 members)
            const expectedMember1Balance = -(expenseAmount1 / 2);
            expect(member1BalanceInMess1.balance).toBeCloseTo(
              expectedMember1Balance,
              2
            );

            // Verify that member2's balance in mess2 is based only on mess2 expenses
            // Member2 should owe half of expenseAmount2
            const expectedMember2Balance = -(expenseAmount2 / 2);
            expect(member2BalanceInMess2.balance).toBeCloseTo(
              expectedMember2Balance,
              2
            );

            // Verify that the balances are different (unless by coincidence they're the same)
            // This ensures that mess1 expenses don't affect mess2 balances and vice versa
            if (Math.abs(expenseAmount1 - expenseAmount2) > 1) {
              expect(Math.abs(member1BalanceInMess1.balance)).not.toBeCloseTo(
                Math.abs(member2BalanceInMess2.balance),
                0
              );
            }

            // Get all balances for mess1 - should only include owner1 and member1
            const mess1Balances = await balanceService.getAllBalances(
              mess1.id,
              owner1.user.id
            );

            // Get all balances for mess2 - should only include owner2 and member2
            const mess2Balances = await balanceService.getAllBalances(
              mess2.id,
              owner2.user.id
            );

            // Verify mess1 balances don't include member2
            const mess1UserIds = mess1Balances.map((b) => b.userId);
            expect(mess1UserIds).not.toContain(member2.user.id);
            expect(mess1UserIds).toContain(owner1.user.id);
            expect(mess1UserIds).toContain(member1.user.id);
            expect(mess1Balances).toHaveLength(2);

            // Verify mess2 balances don't include member1
            const mess2UserIds = mess2Balances.map((b) => b.userId);
            expect(mess2UserIds).not.toContain(member1.user.id);
            expect(mess2UserIds).toContain(owner2.user.id);
            expect(mess2UserIds).toContain(member2.user.id);
            expect(mess2Balances).toHaveLength(2);
          }
        ),
        { numRuns: 5 }
      );
    },
    20000
  ); // 20 second timeout for property-based test

    it(
      'should isolate data when a user is a member of multiple messes',
      async () => {
        await fc.assert(
        fc.asyncProperty(
          // Generate random amounts for expenses in different messes
          fc.float({ min: 100, max: 1000, noNaN: true }),
          fc.float({ min: 100, max: 1000, noNaN: true }),
          async (expenseAmount1Raw, expenseAmount2Raw) => {
            // Round amounts to 2 decimal places to match validation
            const expenseAmount1 = Math.round(expenseAmount1Raw * 100) / 100;
            const expenseAmount2 = Math.round(expenseAmount2Raw * 100) / 100;
            // Create a shared user who will be in both messes
            const sharedUser = await authService.register({
              name: 'Shared User',
              email: `shared-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            // Create two mess owners
            const owner1 = await authService.register({
              name: 'Owner 1',
              email: `owner1-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            const owner2 = await authService.register({
              name: 'Owner 2',
              email: `owner2-${Date.now()}-${Math.random()}@example.com`,
              password: 'Test123!',
            });

            // Create two separate messes
            const mess1 = await messService.createMess(owner1.user.id, {
              name: 'Mess 1',
              memberLimit: 10,
            });

            const mess2 = await messService.createMess(owner2.user.id, {
              name: 'Mess 2',
              memberLimit: 10,
            });

            // Add shared user to both messes
            await messService.joinMessByCode(sharedUser.user.id, mess1.inviteCode);
            await messService.joinMessByCode(sharedUser.user.id, mess2.inviteCode);

            // Create expenses in both messes
            await expenseService.createExpense(owner1.user.id, {
              messId: mess1.id,
              amount: expenseAmount1,
              description: 'Expense in Mess 1',
              category: 'Groceries',
              date: new Date(),
              paidBy: owner1.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            await expenseService.createExpense(owner2.user.id, {
              messId: mess2.id,
              amount: expenseAmount2,
              description: 'Expense in Mess 2',
              category: 'Utilities',
              date: new Date(),
              paidBy: owner2.user.id,
              splitMethod: 'equal' as SplitMethod,
            });

            // Calculate shared user's balance in mess1
            const balanceInMess1 = await balanceService.calculateMemberBalance(
              mess1.id,
              sharedUser.user.id
            );

            // Calculate shared user's balance in mess2
            const balanceInMess2 = await balanceService.calculateMemberBalance(
              mess2.id,
              sharedUser.user.id
            );

            // Verify that balances are calculated independently
            // In mess1, shared user owes half of expenseAmount1 (2 members)
            const expectedBalanceMess1 = -(expenseAmount1 / 2);
            expect(balanceInMess1.balance).toBeCloseTo(expectedBalanceMess1, 2);

            // In mess2, shared user owes half of expenseAmount2 (2 members)
            const expectedBalanceMess2 = -(expenseAmount2 / 2);
            expect(balanceInMess2.balance).toBeCloseTo(expectedBalanceMess2, 2);

            // Query expenses for mess1 - should only return mess1 expense
            const mess1Expenses = await expenseService.getExpenses(
              mess1.id,
              sharedUser.user.id,
              {}
            );

            // Query expenses for mess2 - should only return mess2 expense
            const mess2Expenses = await expenseService.getExpenses(
              mess2.id,
              sharedUser.user.id,
              {}
            );

            // Verify expense isolation
            expect(mess1Expenses.data).toHaveLength(1);
            expect(mess1Expenses.data[0].description).toBe('Expense in Mess 1');
            expect(mess1Expenses.data[0].category).toBe('Groceries');

            expect(mess2Expenses.data).toHaveLength(1);
            expect(mess2Expenses.data[0].description).toBe('Expense in Mess 2');
            expect(mess2Expenses.data[0].category).toBe('Utilities');
          }
        ),
        { numRuns: 5 }
      );
    },
    20000
  ); // 20 second timeout for property-based test
  });
});
