import React, { useState, useEffect } from 'react';
import type { BalanceResponse } from '../../types';
import api from '../../services/api';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface BalanceCardProps {
  userId?: string; // If not provided, shows current user's balance
  showDetails?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  userId, 
  showDetails = false 
}) => {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentMess } = useMessStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (currentMess && targetUserId) {
      fetchBalance();
    }
  }, [currentMess, targetUserId]);

  const fetchBalance = async () => {
    if (!currentMess || !targetUserId) return;

    setIsLoading(true);
    try {
      const endpoint = userId 
        ? `/balances/${userId}` 
        : '/balances/me';
      
      const response = await api.get<BalanceResponse>(
        `${endpoint}?messId=${currentMess.id}`
      );
      
      setBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      addToast('Failed to load balance', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'owed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'owes':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'settled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'owed':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'owes':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'settled':
        return (
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string, amount: number) => {
    switch (status) {
      case 'owed':
        return `You are owed ${formatAmount(amount)}`;
      case 'owes':
        return `You owe ${formatAmount(amount)}`;
      case 'settled':
        return 'All settled up!';
      default:
        return 'Balance unavailable';
    }
  };

  if (!currentMess) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Please select a mess to view balance</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Balance information unavailable</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${getStatusColor(balance.status)} transition-all hover:shadow-lg`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {userId ? `${balance.userName}'s Balance` : 'Your Balance'}
          </h3>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
            {getStatusIcon(balance.status)}
          </div>
        </div>

        {/* Balance Amount */}
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className={`text-4xl font-bold ${
              balance.status === 'owed' ? 'text-green-600' : 
              balance.status === 'owes' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {balance.status === 'owes' && '-'}
              {formatAmount(balance.balance)}
            </span>
          </div>
          <p className={`mt-2 text-sm font-medium ${
            balance.status === 'owed' ? 'text-green-700' : 
            balance.status === 'owes' ? 'text-red-700' : 
            'text-gray-700'
          }`}>
            {getStatusText(balance.status, balance.balance)}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Status
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            balance.status === 'owed' ? 'bg-green-100 text-green-800' : 
            balance.status === 'owes' ? 'bg-red-100 text-red-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {balance.status === 'owed' && '↑ '}
            {balance.status === 'owes' && '↓ '}
            {balance.status.charAt(0).toUpperCase() + balance.status.slice(1)}
          </span>
        </div>

        {/* Details Link */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // This will be handled by parent component
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
            >
              View breakdown
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
