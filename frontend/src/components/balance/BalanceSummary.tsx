import React, { useState, useEffect } from 'react';
import type { BalanceResponse } from '../../types';
import api from '../../services/api';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

type SortField = 'name' | 'balance' | 'status';
type SortOrder = 'asc' | 'desc';

export const BalanceSummary: React.FC = () => {
  const [balances, setBalances] = useState<BalanceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { currentMess, getCurrentUserRole } = useMessStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const userRole = user ? getCurrentUserRole(user.id) : null;
  const canViewAllBalances = userRole === 'Owner' || userRole === 'Admin';

  useEffect(() => {
    if (currentMess && canViewAllBalances) {
      fetchBalances();
    }
  }, [currentMess, canViewAllBalances]);

  const fetchBalances = async () => {
    if (!currentMess) return;

    setIsLoading(true);
    try {
      const response = await api.get(
        `/balances?messId=${currentMess.id}`
      );
      
      // Handle the response structure: { success: true, data: [...] }
      const balancesData = response.data.data || response.data;
      
      // Ensure it's an array
      if (Array.isArray(balancesData)) {
        setBalances(balancesData);
      } else {
        console.error('Balances data is not an array:', balancesData);
        setBalances([]);
        addToast('Invalid balance data received', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      addToast('Failed to load balances', 'error');
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedBalances = [...balances].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.userName.localeCompare(b.userName);
        break;
      case 'balance':
        comparison = a.balance - b.balance;
        break;
      case 'status':
        const statusOrder = { owed: 2, settled: 1, owes: 0 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      owed: 'bg-green-100 text-green-800',
      owes: 'bg-red-100 text-red-800',
      settled: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const totalOwed = balances
    .filter(b => b.status === 'owed')
    .reduce((sum, b) => sum + b.balance, 0);

  const totalOwing = balances
    .filter(b => b.status === 'owes')
    .reduce((sum, b) => sum + Math.abs(b.balance), 0);

  if (!canViewAllBalances) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">
            Only Owners and Admins can view all member balances.
          </p>
        </div>
      </div>
    );
  }

  if (!currentMess) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Please select a mess to view balances</p>
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
      {/* Header with Summary */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-2xl font-bold text-gray-900">{balances.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">Total Owed</p>
            <p className="text-2xl font-bold text-green-600">{formatAmount(totalOwed)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700">Total Owing</p>
            <p className="text-2xl font-bold text-red-600">{formatAmount(totalOwing)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Member</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center space-x-1">
                  <span>Balance</span>
                  {getSortIcon('balance')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedBalances.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <p className="text-gray-500">No balance data available</p>
                </td>
              </tr>
            ) : (
              sortedBalances.map((balance) => (
                <tr key={balance.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {balance.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {balance.userName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${
                      balance.status === 'owed' ? 'text-green-600' : 
                      balance.status === 'owes' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {balance.status === 'owes' && '-'}
                      {formatAmount(balance.balance)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {balance.status === 'owed' && 'To receive'}
                      {balance.status === 'owes' && 'To pay'}
                      {balance.status === 'settled' && 'Settled'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(balance.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
