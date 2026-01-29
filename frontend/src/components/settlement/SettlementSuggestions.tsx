import React, { useState, useEffect } from 'react';
import type { SettlementSuggestion } from '../../types';
import api from '../../services/api';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface SettlementSuggestionsProps {
  onRecordSettlement?: (fromUserId: string, toUserId: string, amount: number) => void;
}

export const SettlementSuggestions: React.FC<SettlementSuggestionsProps> = ({
  onRecordSettlement,
}) => {
  const [suggestions, setSuggestions] = useState<SettlementSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentMess } = useMessStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (currentMess) {
      fetchSuggestions();
    }
  }, [currentMess]);

  const fetchSuggestions = async () => {
    if (!currentMess) return;

    setIsLoading(true);
    try {
      const response = await api.get(
        `/settlements/suggestions?messId=${currentMess.id}`
      );
      
      // Handle the response structure: { success: true, data: [...] }
      const suggestionsData = response.data.data || response.data;
      
      // Ensure it's an array
      if (Array.isArray(suggestionsData)) {
        setSuggestions(suggestionsData);
      } else {
        console.error('Suggestions data is not an array:', suggestionsData);
        setSuggestions([]);
        addToast('Invalid suggestions data received', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch settlement suggestions:', error);
      addToast('Failed to load settlement suggestions', 'error');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSettle = (suggestion: SettlementSuggestion) => {
    if (!user) return;

    // Check if current user is the payer in this suggestion
    if (suggestion.fromUser.id === user.id) {
      onRecordSettlement?.(
        suggestion.fromUser.id,
        suggestion.toUser.id,
        suggestion.amount
      );
    } else {
      addToast('You can only record settlements for yourself', 'info');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isUserInvolved = (suggestion: SettlementSuggestion): boolean => {
    if (!user) return false;
    return suggestion.fromUser.id === user.id || suggestion.toUser.id === user.id;
  };

  if (!currentMess) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Please select a mess to view settlement suggestions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settlement Suggestions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Optimized to minimize the number of transactions
            </p>
          </div>
          <button
            onClick={fetchSuggestions}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">All Settled!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Everyone's balances are settled. No transactions needed.
            </p>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">{suggestions.length}</span> transaction{suggestions.length !== 1 ? 's' : ''} needed to settle all balances
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const userInvolved = isUserInvolved(suggestion);
                const isUserPayer = user?.id === suggestion.fromUser.id;

                return (
                  <div
                    key={`${suggestion.fromUser.id}-${suggestion.toUser.id}-${index}`}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userInvolved
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Transaction Details */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* From User */}
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-medium text-sm">
                              {suggestion.fromUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {suggestion.fromUser.name}
                              {suggestion.fromUser.id === user?.id && (
                                <span className="ml-1 text-xs text-blue-600">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">Payer</p>
                          </div>
                        </div>

                        {/* Arrow and Amount */}
                        <div className="flex flex-col items-center px-4">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="text-lg font-bold text-gray-900 mt-1">
                            {formatAmount(suggestion.amount)}
                          </span>
                        </div>

                        {/* To User */}
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {suggestion.toUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {suggestion.toUser.name}
                              {suggestion.toUser.id === user?.id && (
                                <span className="ml-1 text-xs text-blue-600">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">Receiver</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {isUserPayer && (
                        <button
                          onClick={() => handleQuickSettle(suggestion)}
                          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Note:</span> These suggestions use an optimized algorithm to minimize the number of transactions needed to settle all balances. The total amount transferred will equal the sum of all outstanding debts.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
