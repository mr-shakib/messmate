import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMessStore } from '../../store/messStore';
import api from '../../services/api';
import type { DashboardResponse } from '../../types';
import ExpenseSummaryCard from './ExpenseSummaryCard';
import CategoryChart from './CategoryChart';
import RecentTransactions from './RecentTransactions';
import MemberAnalyticsTable from './MemberAnalyticsTable';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMess, getCurrentUserRole } = useMessStore();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = user && currentMess ? getCurrentUserRole(user.id) : null;
  const canViewMemberAnalytics = userRole === 'Owner' || userRole === 'Admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentMess) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get(`/dashboard?messId=${currentMess.id}`);
        setDashboardData(response.data.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentMess]);

  if (!currentMess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Mess Selected</h2>
          <p className="text-gray-500 mb-6">
            To view your dashboard, you need to create or join a mess first.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/messes')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create or Join a Mess</span>
            </button>
            <p className="text-sm text-gray-500">
              You can also use the sidebar to navigate to "Messes"
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Failed to load dashboard data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{currentMess.name} Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your mess expenses and balances</p>
      </div>

      {/* Grid layout for dashboard cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expense Summary Card */}
        <ExpenseSummaryCard
          currentMonthTotal={dashboardData.currentMonthTotal}
          userBalance={dashboardData.userBalance}
        />

        {/* Category Chart */}
        <CategoryChart categoryBreakdown={dashboardData.categoryBreakdown} />
      </div>

      {/* Recent Transactions */}
      <div className="mb-6">
        <RecentTransactions transactions={dashboardData.recentTransactions} />
      </div>

      {/* Member Analytics (Owner/Admin only) */}
      {canViewMemberAnalytics && dashboardData.memberAnalytics && (
        <div>
          <MemberAnalyticsTable memberAnalytics={dashboardData.memberAnalytics} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
