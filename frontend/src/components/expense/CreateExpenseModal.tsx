import React, { useState } from 'react';
import type { ExpenseCategory, SplitMethod, ExpenseSplit } from '../../types';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import { SplitCalculator } from './SplitCalculator';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Groceries',
  'Utilities',
  'Rent',
  'Food',
  'Entertainment',
  'Other',
];

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentMess } = useMessStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  // Step 1: Expense Details
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState<string>(user?.id || '');

  // Step 2: Split Configuration
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [excludedMembers, setExcludedMembers] = useState<string[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [isSplitValid, setIsSplitValid] = useState<boolean>(true);
  const [splitError, setSplitError] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    // Reset form
    setStep(1);
    setAmount('');
    setDescription('');
    setCategory('Groceries');
    setDate(new Date().toISOString().split('T')[0]);
    setPaidBy(user?.id || '');
    setSplitMethod('equal');
    setExcludedMembers([]);
    setSplits([]);
    setIsSplitValid(true);
    setSplitError('');
    onClose();
  };

  const handleNextStep = () => {
    // Validate step 1
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    if (!description.trim()) {
      addToast('Please enter a description', 'error');
      return;
    }
    if (!paidBy) {
      addToast('Please select who paid', 'error');
      return;
    }

    setStep(2);
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const toggleMemberExclusion = (userId: string) => {
    setExcludedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!currentMess || !user) return;

    if (!isSplitValid) {
      addToast(splitError || 'Please fix split validation errors', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        messId: currentMess.id,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        date: new Date(date),
        paidBy,
        splitMethod,
        splits,
        excludedMembers,
      });

      addToast('Expense created successfully', 'success');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create expense:', error);
      // Error toast is handled by API interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !currentMess) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Create New Expense
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-4">
            <div className="flex items-center">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {step === 1 ? '1' : '✓'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  Details
                </span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                <div
                  className={`h-full ${
                    step === 2 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              </div>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  Split
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Step 1: Expense Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., Grocery shopping"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="paidBy"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Paid By *
                  </label>
                  <select
                    id="paidBy"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {currentMess.members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Split Configuration */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSplitMethod('equal')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        splitMethod === 'equal'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Equal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMethod('unequal')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        splitMethod === 'unequal'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Unequal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMethod('percentage')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        splitMethod === 'percentage'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Percentage
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Members
                  </label>
                  <div className="space-y-2">
                    {currentMess.members.map((member) => (
                      <label
                        key={member.userId}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!excludedMembers.includes(member.userId)}
                          onChange={() => toggleMemberExclusion(member.userId)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <SplitCalculator
                  amount={parseFloat(amount) || 0}
                  splitMethod={splitMethod}
                  members={currentMess.members}
                  excludedMembers={excludedMembers}
                  onSplitsChange={setSplits}
                  onValidationChange={(isValid, error) => {
                    setIsSplitValid(isValid);
                    setSplitError(error || '');
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={step === 1 ? handleClose : handlePreviousStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={step === 1 ? handleNextStep : handleSubmit}
              disabled={isSubmitting || (step === 2 && !isSplitValid)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : step === 1 ? 'Next' : 'Create Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
