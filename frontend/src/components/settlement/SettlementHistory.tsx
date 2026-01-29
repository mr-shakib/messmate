import React, { useState, useEffect } from 'react';
import type { Settlement, SettlementFilters, PaginatedResponse } from '../../types';
import api from '../../services/api';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface SettlementHistoryProps {
  userId?: string; // Filter by specific user
}

export const SettlementHistory: React.FC<SettlementHistoryProps> = ({ userId }) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SettlementFilters>({
    page: 1,
    limit: 20,
    userId: userId,
  });
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const { currentMess } = useMessStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (currentMess) {
      fetchSettlements();
    }
  }, [currentMess, filters]);

  const fetchSettlements = async () => {
    if (!currentMess) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('messId', currentMess.id);
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.userId) params.append('userId', filters.userId);

      const response = await api.get(
        `/settlements?${params.toString()}`
      );
      
      // Handle the response structure: { success: true, data: { data: [...], pagination: {...} } }
      const responseData = response.data.data || response.data;
      
      if (responseData.data && Array.isArray(responseData.data)) {
        setSettlements(responseData.data);
        setPagination(responseData.pagination || pagination);
      } else if (Array.isArray(responseData)) {
        // Fallback if response is just an array
        setSettlements(responseData);
      } else {
        console.error('Settlements data is not in expected format:', responseData);
        setSettlements([]);
        addToast('Invalid settlements data received', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      setSettlements([]);
      addToast('Failed to load settlement history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleDateFilter = () => {
    const newFilters: SettlementFilters = { ...filters, page: 1 };
    
    if (startDate) {
      newFilters.startDate = new Date(startDate);
    } else {
      delete newFilters.startDate;
    }
    
    if (endDate) {
      newFilters.endDate = new Date(endDate);
    } else {
      delete newFilters.endDate;
    }
    
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilters({
      page: 1,
      limit: 20,
      userId: userId,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isUserInvolved = (settlement: Settlement): boolean => {
    if (!user) return false;
    return settlement.fromUser.id === user.id || settlement.toUser.id === user.id;
  };

  if (!currentMess) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Please select a mess to view settlement history</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Settlement History</h2>
        <p className="text-sm text-gray-600 mt-1">
          View all recorded settlements
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No settlements</h3>
            <p className="mt-1 text-sm text-gray-500">
              No settlement records found for the selected filters.
            </p>
          </div>
        ) : (
          <>
            {/* Settlements List */}
            <div className="space-y-3">
              {settlements.map((settlement) => {
                const userInvolved = isUserInvolved(settlement);
                const isUserPayer = user?.id === settlement.fromUser.id;
                const isUserReceiver = user?.id === settlement.toUser.id;

                return (
                  <div
                    key={settlement.id}
                    className={`p-4 rounded-lg border transition-all ${
                      userInvolved
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Settlement Details */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* From User */}
                        <div className="flex items-center min-w-[150px]">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-medium text-sm">
                              {settlement.fromUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {settlement.fromUser.name}
                              {isUserPayer && (
                                <span className="ml-1 text-xs text-blue-600">(You)</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>

                        {/* To User */}
                        <div className="flex items-center min-w-[150px]">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {settlement.toUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {settlement.toUser.name}
                              {isUserReceiver && (
                                <span className="ml-1 text-xs text-blue-600">(You)</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Amount and Date */}
                        <div className="flex-1 text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatAmount(settlement.amount)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(settlement.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {settlement.description && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Note:</span> {settlement.description}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * pagination.itemsPerPage,
                        pagination.totalItems
                      )}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) {
                        page = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        page = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        page = pagination.totalPages - 4 + i;
                      } else {
                        page = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
