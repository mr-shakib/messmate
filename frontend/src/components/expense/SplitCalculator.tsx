import React, { useState, useEffect } from 'react';
import type { SplitMethod, ExpenseSplit, MemberInfo } from '../../types';

interface SplitCalculatorProps {
  amount: number;
  splitMethod: SplitMethod;
  members: MemberInfo[];
  excludedMembers: string[];
  onSplitsChange: (splits: ExpenseSplit[]) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export const SplitCalculator: React.FC<SplitCalculatorProps> = ({
  amount,
  splitMethod,
  members,
  excludedMembers,
  onSplitsChange,
  onValidationChange,
}) => {
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [validationError, setValidationError] = useState<string>('');

  const activeMembers = members.filter((m) => !excludedMembers.includes(m.userId));

  useEffect(() => {
    calculateSplits();
  }, [amount, splitMethod, members, excludedMembers]);

  const calculateSplits = () => {
    if (!amount || amount <= 0 || activeMembers.length === 0) {
      setSplits([]);
      onSplitsChange([]);
      return;
    }

    let newSplits: ExpenseSplit[] = [];
    let error = '';

    switch (splitMethod) {
      case 'equal':
        newSplits = calculateEqualSplit();
        break;
      case 'unequal':
        newSplits = calculateUnequalSplit();
        break;
      case 'percentage':
        newSplits = calculatePercentageSplit();
        break;
    }

    setSplits(newSplits);
    setValidationError(error);
    onSplitsChange(newSplits);
    onValidationChange?.(error === '', error);
  };

  const calculateEqualSplit = (): ExpenseSplit[] => {
    const splitAmount = Math.round((amount / activeMembers.length) * 100) / 100;
    return activeMembers.map((member) => ({
      userId: member.userId,
      amount: splitAmount,
    }));
  };

  const calculateUnequalSplit = (): ExpenseSplit[] => {
    // Initialize with equal split as default
    if (splits.length === 0 || splits.length !== activeMembers.length) {
      return calculateEqualSplit();
    }
    return splits;
  };

  const calculatePercentageSplit = (): ExpenseSplit[] => {
    // Initialize with equal percentages as default
    if (splits.length === 0 || splits.length !== activeMembers.length) {
      const equalPercentage = Math.round((100 / activeMembers.length) * 100) / 100;
      return activeMembers.map((member) => ({
        userId: member.userId,
        percentage: equalPercentage,
        amount: Math.round((amount * equalPercentage / 100) * 100) / 100,
      }));
    }
    return splits;
  };

  const handleUnequalAmountChange = (userId: string, value: string) => {
    const newAmount = parseFloat(value) || 0;
    const newSplits = splits.map((split) =>
      split.userId === userId ? { ...split, amount: newAmount } : split
    );

    const total = newSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    const error = Math.abs(total - amount) > 0.01
      ? `Total (${total.toFixed(2)}) must equal expense amount (${amount.toFixed(2)})`
      : '';

    setSplits(newSplits);
    setValidationError(error);
    onSplitsChange(newSplits);
    onValidationChange?.(error === '', error);
  };

  const handlePercentageChange = (userId: string, value: string) => {
    const newPercentage = parseFloat(value) || 0;
    const newSplits = splits.map((split) =>
      split.userId === userId
        ? {
            ...split,
            percentage: newPercentage,
            amount: Math.round((amount * newPercentage / 100) * 100) / 100,
          }
        : split
    );

    const totalPercentage = newSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
    const error = Math.abs(totalPercentage - 100) > 0.01
      ? `Total percentage (${totalPercentage.toFixed(2)}%) must equal 100%`
      : '';

    setSplits(newSplits);
    setValidationError(error);
    onSplitsChange(newSplits);
    onValidationChange?.(error === '', error);
  };

  const getMemberName = (userId: string) => {
    return members.find((m) => m.userId === userId)?.name || 'Unknown';
  };

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amt);
  };

  if (activeMembers.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please select at least one member to split the expense
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Split Preview</h4>
        <span className="text-sm text-gray-500">
          {activeMembers.length} {activeMembers.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      {/* Equal Split */}
      {splitMethod === 'equal' && (
        <div className="space-y-2">
          {splits.map((split) => (
            <div
              key={split.userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <span className="text-sm font-medium text-gray-900">
                {getMemberName(split.userId)}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatAmount(split.amount || 0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Unequal Split */}
      {splitMethod === 'unequal' && (
        <div className="space-y-2">
          {splits.map((split) => (
            <div key={split.userId} className="flex items-center space-x-3">
              <label className="flex-1 text-sm font-medium text-gray-700">
                {getMemberName(split.userId)}
              </label>
              <div className="flex-shrink-0 w-32">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={split.amount || 0}
                  onChange={(e) => handleUnequalAmountChange(split.userId, e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatAmount(splits.reduce((sum, split) => sum + (split.amount || 0), 0))}
            </span>
          </div>
        </div>
      )}

      {/* Percentage Split */}
      {splitMethod === 'percentage' && (
        <div className="space-y-2">
          {splits.map((split) => (
            <div key={split.userId} className="space-y-1">
              <div className="flex items-center space-x-3">
                <label className="flex-1 text-sm font-medium text-gray-700">
                  {getMemberName(split.userId)}
                </label>
                <div className="flex-shrink-0 w-24">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={split.percentage || 0}
                      onChange={(e) => handlePercentageChange(split.userId, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-6"
                      placeholder="0"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 text-sm">
                      %
                    </span>
                  </div>
                </div>
                <span className="flex-shrink-0 w-24 text-right text-sm font-medium text-gray-900">
                  {formatAmount(split.amount || 0)}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-900">
                {splits.reduce((sum, split) => sum + (split.percentage || 0), 0).toFixed(2)}%
              </span>
              <span className="w-24 text-right text-sm font-semibold text-gray-900">
                {formatAmount(splits.reduce((sum, split) => sum + (split.amount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{validationError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
