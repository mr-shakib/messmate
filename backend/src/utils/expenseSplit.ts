import mongoose from 'mongoose';

/**
 * Interface for expense split input
 */
export interface SplitInput {
  memberId: string;
  percentage?: number; // For custom split
}

/**
 * Interface for calculated split result
 */
export interface SplitResult {
  memberId: mongoose.Types.ObjectId;
  amount: number;
  percentage: number;
}

/**
 * Round amount to 2 decimal places
 * @param amount - Amount to round
 * @returns Rounded amount
 */
function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate equal split among members
 * Divides the total amount equally among all non-excluded members
 * 
 * @param totalAmount - Total expense amount
 * @param memberIds - Array of member user IDs to split among
 * @param excludedMemberIds - Array of member user IDs to exclude from split (optional)
 * @returns Array of split results with equal amounts
 */
export function calculateEqualSplit(
  totalAmount: number,
  memberIds: string[],
  excludedMemberIds: string[] = []
): SplitResult[] {
  // Validate inputs
  if (totalAmount <= 0) {
    throw new Error('Total amount must be positive');
  }

  if (!memberIds || memberIds.length === 0) {
    throw new Error('At least one member is required');
  }

  // Filter out excluded members
  const includedMembers = memberIds.filter(
    (id) => !excludedMemberIds.includes(id)
  );

  if (includedMembers.length === 0) {
    throw new Error('At least one member must be included in the split');
  }

  // Calculate equal share per member
  const percentagePerMember = 100 / includedMembers.length;
  const sharePerMember = totalAmount / includedMembers.length;
  const roundedShare = roundToTwoDecimals(sharePerMember);

  // Calculate the difference due to rounding
  const totalRounded = roundedShare * includedMembers.length;
  const difference = roundToTwoDecimals(totalAmount - totalRounded);

  // Create splits
  const splits: SplitResult[] = includedMembers.map((memberId, index) => {
    let amount = roundedShare;

    // Add the rounding difference to the first member's share
    if (index === 0 && difference !== 0) {
      amount = roundToTwoDecimals(amount + difference);
    }

    return {
      memberId: new mongoose.Types.ObjectId(memberId),
      amount,
      percentage: roundToTwoDecimals(percentagePerMember),
    };
  });

  return splits;
}

/**
 * Calculate custom percentage-based split
 * Validates that percentages sum to 100% and calculates amounts accordingly
 * 
 * @param totalAmount - Total expense amount
 * @param splits - Array of split inputs with percentages
 * @returns Array of split results with calculated amounts and percentages
 */
export function calculateCustomSplit(
  totalAmount: number,
  splits: SplitInput[]
): SplitResult[] {
  // Validate inputs
  if (totalAmount <= 0) {
    throw new Error('Total amount must be positive');
  }

  if (!splits || splits.length === 0) {
    throw new Error('At least one split is required');
  }

  // Validate all splits have percentages
  for (const split of splits) {
    if (split.percentage === undefined || split.percentage === null) {
      throw new Error('All splits must have a percentage for custom split');
    }

    if (split.percentage < 0 || split.percentage > 100) {
      throw new Error('Percentages must be between 0 and 100');
    }
  }

  // Calculate total percentage
  const totalPercentage = splits.reduce(
    (sum, split) => sum + (split.percentage || 0),
    0
  );

  // Validate that percentages sum to 100% (with small tolerance for rounding)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(
      `Sum of percentages must equal 100% (current: ${totalPercentage.toFixed(2)}%)`
    );
  }

  // Calculate amounts based on percentages
  const results: SplitResult[] = splits.map((split) => {
    const amount = (totalAmount * (split.percentage! / 100));
    return {
      memberId: new mongoose.Types.ObjectId(split.memberId),
      amount: roundToTwoDecimals(amount),
      percentage: split.percentage!,
    };
  });

  // Adjust for rounding errors - add/subtract difference to/from the largest split
  const totalCalculated = results.reduce((sum, r) => sum + r.amount, 0);
  const difference = roundToTwoDecimals(totalAmount - totalCalculated);

  if (difference !== 0) {
    // Find the split with the largest amount
    const largestSplitIndex = results.reduce(
      (maxIndex, current, currentIndex, array) =>
        current.amount > array[maxIndex].amount ? currentIndex : maxIndex,
      0
    );

    results[largestSplitIndex].amount = roundToTwoDecimals(
      results[largestSplitIndex].amount + difference
    );
  }

  return results;
}

/**
 * Validate and calculate splits based on split method
 * Main entry point for split calculation
 * 
 * @param splitMethod - Split method ('equal', 'custom', 'exclude')
 * @param totalAmount - Total expense amount
 * @param memberIds - Array of all member user IDs (for equal/exclude split)
 * @param splits - Array of split inputs (for custom split)
 * @param excludedMemberIds - Array of excluded member user IDs (for exclude split)
 * @returns Array of calculated split results
 */
export function calculateSplits(
  splitMethod: 'equal' | 'custom' | 'exclude',
  totalAmount: number,
  memberIds?: string[],
  splits?: SplitInput[],
  excludedMemberIds?: string[]
): SplitResult[] {
  switch (splitMethod) {
    case 'equal':
      if (!memberIds || memberIds.length === 0) {
        throw new Error('Member IDs are required for equal split');
      }
      return calculateEqualSplit(totalAmount, memberIds);

    case 'custom':
      if (!splits || splits.length === 0) {
        throw new Error('Splits are required for custom split');
      }
      return calculateCustomSplit(totalAmount, splits);

    case 'exclude':
      if (!memberIds || memberIds.length === 0) {
        throw new Error('Member IDs are required for exclude split');
      }
      if (!excludedMemberIds || excludedMemberIds.length === 0) {
        throw new Error('Excluded member IDs are required for exclude split');
      }
      return calculateEqualSplit(totalAmount, memberIds, excludedMemberIds);

    default:
      throw new Error(`Invalid split method: ${splitMethod}`);
  }
}
