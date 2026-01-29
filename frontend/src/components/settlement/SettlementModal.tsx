import React, { useState, useEffect } from 'react';
import type { MemberInfo, CreateSettlementDTO, BalanceResponse } from '../../types';
import api from '../../services/api';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedPayee?: string; // userId
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedPayee,
}) => {
  const [selectedPayee, setSelectedPayee] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ payee?: string; amount?: string }>({});
  const [userBalance, setUserBalance] = useState<BalanceResponse | null>(null);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  
  const { currentMess } = useMessStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (isOpen && currentMess && user) {
      fetchUserBalance();
      if (preselectedPayee) {
        setSelectedPayee(preselectedPayee);
      }
    }
  }, [isOpen, currentMess, user, preselectedPayee]);

  useEffect(() => {
    if (selectedPayee && userBalance) {
      calculateMaxAmount();
    }
  }, [selectedPayee, userBalance]);

  const fetchUserBalance = async () => {
    if (!currentMess || !user) return;

    try {
      const response = await api.get<BalanceResponse>(
        `/balances/me?messId=${currentMess.id}`
      );
      setUserBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const calculateMaxAmount = () => {
    if (!userBalance || !selectedPayee) {
      setMaxAmount(0);
      return;
    }

    // If user owes money (negative balance), they can settle up to their debt
    if (userBalance.status === 'owes') {
      setMaxAmount(Math.abs(userBalance.balance));
    } else {
      // If user is owed money, they shouldn't be making settlements
      setMaxAmount(0);
    }
  };

  const getEligiblePayees = (): MemberInfo[] => {
    if (!currentMess || !user) return [];
    
    // User can only pay to other members (not themselves)
    return currentMess.members.filter(member => member.userId !== user.id);
  };

  const validateForm = (): boolean => {
    const newErrors: { payee?: string; amount?: string } = {};

    if (!selectedPayee) {
      newErrors.payee = 'Please select a payee';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(amount) > maxAmount && maxAmount > 0) {
      newErrors.amount = `Amount cannot exceed your outstanding balance of $${maxAmount.toFixed(2)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentMess || !user) return;

    setIsSubmitting(true);
    try {
      const settlementData: CreateSettlementDTO = {
        messId: currentMess.id,
        fromUserId: user.id,
        toUserId: selectedPayee,
        amount: parseFloat(amount),
        description: description.trim() || undefined,
      };

      await api.post('/settlements', settlementData);

      addToast('Settlement recorded successfully', 'success');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to record settlement:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to record settlement';
      addToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPayee('');
    setAmount('');
    setDescription('');
    setErrors({});
    setMaxAmount(0);
    onClose();
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (!isOpen) return null;

  const eligiblePayees = getEligiblePayees();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Record Settlement
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Balance Info */}
              {userBalance && userBalance.status === 'owes' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Your current balance: <span className="font-semibold">{formatAmount(userBalance.balance)}</span>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You can settle up to {formatAmount(Math.abs(userBalance.balance))}
                  </p>
                </div>
              )}

              {userBalance && userBalance.status === 'owed' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    You are owed {formatAmount(userBalance.balance)}. You don't need to make a settlement.
                  </p>
                </div>
              )}

              {userBalance && userBalance.status === 'settled' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    You're all settled up! No outstanding balance.
                  </p>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Payee Selection */}
                <div>
                  <label htmlFor="payee" className="block text-sm font-medium text-gray-700 mb-1">
                    Pay to <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="payee"
                    value={selectedPayee}
                    onChange={(e) => {
                      setSelectedPayee(e.target.value);
                      setErrors({ ...errors, payee: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.payee ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select a member</option>
                    {eligiblePayees.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                  {errors.payee && (
                    <p className="mt-1 text-sm text-red-600">{errors.payee}</p>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrors({ ...errors, amount: undefined });
                      }}
                      step="0.01"
                      min="0.01"
                      max={maxAmount > 0 ? maxAmount : undefined}
                      placeholder="0.00"
                      className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                  {maxAmount > 0 && !errors.amount && (
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum: {formatAmount(maxAmount)}
                    </p>
                  )}
                </div>

                {/* Description Input */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Add a note about this settlement..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || (userBalance?.status !== 'owes')}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recording...
                  </>
                ) : (
                  'Record Settlement'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
