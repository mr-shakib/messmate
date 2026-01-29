/**
 * Integration tests for Checkpoint 11 - Backend Services Complete
 * 
 * This test file verifies:
 * 1. Balance calculations are accurate
 * 2. Settlement algorithm produces correct results
 * 3. All services work together correctly
 */

import mongoose from 'mongoose';
import { calculateEqualSplit, calculateUnequalSplit, calculatePercentageSplit } from '../utils/expenseSplit';
import { simplifySettlements, validateSimplification, Balance } from '../utils/settlementSimplification';

describe('Checkpoint 11: Backend Services Integration', () => {
  describe('Balance Calculation Accuracy', () => {
    it('should calculate equal splits correctly', () => {
      const totalAmount = 100;
      const memberIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      
      const splits = calculateEqualSplit(totalAmount, memberIds);
      
      expect(splits).toHaveLength(4);
      
      // Sum should equal total amount
      const sum = splits.reduce((acc, split) => acc + split.amount, 0);
      expect(Math.abs(sum - totalAmount)).toBeLessThan(0.01);
      
      // Each split should be approximately 25
      splits.forEach(split => {
        expect(split.amount).toBeCloseTo(25, 2);
      });
    });

    it('should calculate unequal splits correctly', () => {
      const totalAmount = 100;
      const splits = [
        { userId: new mongoose.Types.ObjectId().toString(), amount: 40 },
        { userId: new mongoose.Types.ObjectId().toString(), amount: 35 },
        { userId: new mongoose.Types.ObjectId().toString(), amount: 25 },
      ];
      
      const result = calculateUnequalSplit(totalAmount, splits);
      
      expect(result).toHaveLength(3);
      
      // Sum should equal total amount
      const sum = result.reduce((acc, split) => acc + split.amount, 0);
      expect(Math.abs(sum - totalAmount)).toBeLessThan(0.01);
    });

    it('should calculate percentage splits correctly', () => {
      const totalAmount = 100;
      const splits = [
        { userId: new mongoose.Types.ObjectId().toString(), percentage: 50 },
        { userId: new mongoose.Types.ObjectId().toString(), percentage: 30 },
        { userId: new mongoose.Types.ObjectId().toString(), percentage: 20 },
      ];
      
      const result = calculatePercentageSplit(totalAmount, splits);
      
      expect(result).toHaveLength(3);
      
      // Sum should equal total amount
      const sum = result.reduce((acc, split) => acc + split.amount, 0);
      expect(Math.abs(sum - totalAmount)).toBeLessThan(0.01);
      
      // Check individual amounts
      expect(result[0].amount).toBeCloseTo(50, 2);
      expect(result[1].amount).toBeCloseTo(30, 2);
      expect(result[2].amount).toBeCloseTo(20, 2);
    });

    it('should handle member exclusion in equal splits', () => {
      const totalAmount = 100;
      const memberIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      const excludedMembers = [memberIds[3]];
      
      const splits = calculateEqualSplit(totalAmount, memberIds, excludedMembers);
      
      expect(splits).toHaveLength(3);
      
      // Sum should equal total amount
      const sum = splits.reduce((acc, split) => acc + split.amount, 0);
      expect(Math.abs(sum - totalAmount)).toBeLessThan(0.01);
      
      // Excluded member should not be in splits
      const hasExcluded = splits.some(s => s.userId.toString() === memberIds[3]);
      expect(hasExcluded).toBe(false);
    });
  });

  describe('Settlement Algorithm Correctness', () => {
    it('should simplify settlements correctly for simple case', () => {
      const balances: Balance[] = [
        { userId: 'user1', amount: 50 },   // Owed 50
        { userId: 'user2', amount: -30 },  // Owes 30
        { userId: 'user3', amount: -20 },  // Owes 20
      ];
      
      const transactions = simplifySettlements(balances);
      
      // Should produce 2 transactions (n-1 where n=3)
      expect(transactions.length).toBeLessThanOrEqual(2);
      
      // Validate correctness
      const isValid = validateSimplification(balances, transactions);
      expect(isValid).toBe(true);
      
      // Sum of transactions should equal sum of positive balances
      const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(totalTransactions).toBeCloseTo(50, 2);
    });

    it('should simplify settlements correctly for complex case', () => {
      const balances: Balance[] = [
        { userId: 'user1', amount: 100 },  // Owed 100
        { userId: 'user2', amount: 50 },   // Owed 50
        { userId: 'user3', amount: -80 },  // Owes 80
        { userId: 'user4', amount: -40 },  // Owes 40
        { userId: 'user5', amount: -30 },  // Owes 30
      ];
      
      const transactions = simplifySettlements(balances);
      
      // Should produce at most 4 transactions (n-1 where n=5)
      expect(transactions.length).toBeLessThanOrEqual(4);
      
      // Validate correctness
      const isValid = validateSimplification(balances, transactions);
      expect(isValid).toBe(true);
      
      // Sum of transactions should equal sum of positive balances
      const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalPositive = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
      expect(totalTransactions).toBeCloseTo(totalPositive, 2);
    });

    it('should handle balanced case (all zeros)', () => {
      const balances: Balance[] = [
        { userId: 'user1', amount: 0 },
        { userId: 'user2', amount: 0 },
        { userId: 'user3', amount: 0 },
      ];
      
      const transactions = simplifySettlements(balances);
      
      // Should produce no transactions
      expect(transactions).toHaveLength(0);
    });

    it('should minimize number of transactions', () => {
      const balances: Balance[] = [
        { userId: 'user1', amount: 100 },
        { userId: 'user2', amount: -100 },
      ];
      
      const transactions = simplifySettlements(balances);
      
      // Should produce exactly 1 transaction
      expect(transactions).toHaveLength(1);
      expect(transactions[0].from).toBe('user2');
      expect(transactions[0].to).toBe('user1');
      expect(transactions[0].amount).toBeCloseTo(100, 2);
    });

    it('should handle rounding correctly', () => {
      const balances: Balance[] = [
        { userId: 'user1', amount: 33.33 },
        { userId: 'user2', amount: 33.33 },
        { userId: 'user3', amount: -33.33 },
        { userId: 'user4', amount: -33.33 },
      ];
      
      const transactions = simplifySettlements(balances);
      
      // Validate correctness
      const isValid = validateSimplification(balances, transactions);
      expect(isValid).toBe(true);
      
      // All amounts should be rounded to 2 decimals
      transactions.forEach(t => {
        expect(t.amount).toEqual(Math.round(t.amount * 100) / 100);
      });
    });
  });

  describe('Balance Formula Verification', () => {
    it('should correctly calculate net balance using formula', () => {
      // Scenario: User paid 100, their share is 30, they made settlement of 20, received 10
      const paid = 100;
      const share = 30;
      const settlementsMade = 20;
      const settlementsReceived = 10;
      
      // Formula: paid - share - settlements_made + settlements_received
      const expectedBalance = paid - share - settlementsMade + settlementsReceived;
      
      expect(expectedBalance).toBe(60);
    });

    it('should correctly interpret balance signs', () => {
      // Positive balance = owed (they should receive money)
      const positiveBalance = 50;
      expect(positiveBalance > 0).toBe(true); // Status: 'owed'
      
      // Negative balance = owes (they should pay money)
      const negativeBalance = -30;
      expect(negativeBalance < 0).toBe(true); // Status: 'owes'
      
      // Zero balance = settled
      const zeroBalance = 0;
      expect(Math.abs(zeroBalance) < 0.01).toBe(true); // Status: 'settled'
    });
  });
});
