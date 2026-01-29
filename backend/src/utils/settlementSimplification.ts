/**
 * Settlement Simplification Algorithm
 * 
 * Implements a greedy algorithm to minimize the number of transactions
 * needed to settle all balances in a mess.
 * 
 * Requirements: 7.4, 7.5, 7.6
 * Property 30: Settlement Simplification Correctness
 */

export interface Balance {
  userId: string;
  amount: number;
}

export interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
}

/**
 * Simplify settlements using a greedy algorithm
 * 
 * Algorithm:
 * 1. Calculate net balance for each member
 * 2. Separate members into creditors (positive balance) and debtors (negative balance)
 * 3. Sort creditors by balance descending, debtors by absolute balance descending
 * 4. Match largest creditor with largest debtor
 * 5. Transfer minimum of (creditor balance, debtor absolute balance)
 * 6. Remove settled members from lists
 * 7. Repeat until all balances are zero
 * 
 * Time Complexity: O(n log n) due to sorting
 * Space Complexity: O(n) for storing balances
 * 
 * @param balances - Array of user balances (positive = owed, negative = owes)
 * @returns Array of settlement transactions that clear all balances
 */
export function simplifySettlements(balances: Balance[]): SettlementTransaction[] {
  const transactions: SettlementTransaction[] = [];

  // Filter out balances that are essentially zero (within 0.01 tolerance)
  const nonZeroBalances = balances.filter(
    (b) => Math.abs(b.amount) > 0.01
  );

  // Separate creditors (positive balance - they are owed money) and debtors (negative balance - they owe money)
  const creditors = nonZeroBalances
    .filter((b) => b.amount > 0.01)
    .map((b) => ({ userId: b.userId, amount: b.amount }))
    .sort((a, b) => b.amount - a.amount); // Sort descending by amount

  const debtors = nonZeroBalances
    .filter((b) => b.amount < -0.01)
    .map((b) => ({ userId: b.userId, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount); // Sort descending by absolute amount

  // Use two pointers to match creditors with debtors
  let i = 0; // Creditor index
  let j = 0; // Debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // Transfer the minimum of what the creditor is owed and what the debtor owes
    const transferAmount = Math.min(creditor.amount, debtor.amount);

    // Round to 2 decimal places
    const roundedAmount = Math.round(transferAmount * 100) / 100;

    // Create transaction (debtor pays creditor)
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: roundedAmount,
    });

    // Update balances
    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    // Move to next creditor if current one is settled
    if (creditor.amount < 0.01) {
      i++;
    }

    // Move to next debtor if current one is settled
    if (debtor.amount < 0.01) {
      j++;
    }
  }

  return transactions;
}

/**
 * Validate that settlement simplification is correct
 * 
 * Checks:
 * 1. Sum of all transaction amounts equals sum of all positive balances
 * 2. After applying all transactions, all balances become zero
 * 3. Number of transactions ≤ (number of members - 1)
 * 
 * @param originalBalances - Original balances before simplification
 * @param transactions - Simplified transactions
 * @returns true if simplification is valid, false otherwise
 */
export function validateSimplification(
  originalBalances: Balance[],
  transactions: SettlementTransaction[]
): boolean {
  // Check 1: Sum of transaction amounts equals sum of positive balances
  const totalPositive = originalBalances
    .filter((b) => b.amount > 0)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);

  const roundedPositive = Math.round(totalPositive * 100) / 100;
  const roundedTransactions = Math.round(totalTransactions * 100) / 100;

  if (Math.abs(roundedPositive - roundedTransactions) > 0.01) {
    return false;
  }

  // Check 2: After applying transactions, all balances become zero
  const finalBalances = new Map<string, number>();

  // Initialize with original balances
  originalBalances.forEach((b) => {
    finalBalances.set(b.userId, b.amount);
  });

  // Apply each transaction
  transactions.forEach((t) => {
    const fromBalance = finalBalances.get(t.from) || 0;
    const toBalance = finalBalances.get(t.to) || 0;

    finalBalances.set(t.from, fromBalance + t.amount); // Debtor pays, balance increases
    finalBalances.set(t.to, toBalance - t.amount); // Creditor receives, balance decreases
  });

  // Check all balances are essentially zero
  for (const balance of finalBalances.values()) {
    if (Math.abs(balance) > 0.01) {
      return false;
    }
  }

  // Check 3: Number of transactions ≤ (number of members - 1)
  const nonZeroMembers = originalBalances.filter((b) => Math.abs(b.amount) > 0.01).length;
  if (transactions.length > nonZeroMembers - 1) {
    return false;
  }

  return true;
}
