import React, { useState } from 'react';
import type { MemberAnalytics } from '../../types';

interface MemberAnalyticsTableProps {
  memberAnalytics: MemberAnalytics[];
}

type SortField = 'userName' | 'totalPaid' | 'totalShare' | 'balance';
type SortOrder = 'asc' | 'desc';

const MemberAnalyticsTable: React.FC<MemberAnalyticsTableProps> = ({ memberAnalytics }) => {
  const [sortField, setSortField] = useState<SortField>('userName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedAnalytics = [...memberAnalytics].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'userName':
        aValue = a.userName.toLowerCase();
        bValue = b.userName.toLowerCase();
        break;
      case 'totalPaid':
        aValue = a.totalPaid;
        bValue = b.totalPaid;
        break;
      case 'totalShare':
        aValue = a.totalShare;
        bValue = b.totalShare;
        break;
      case 'balance':
        aValue = a.balance;
        bValue = b.balance;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return 'text-green-600 font-semibold';
    if (balance < 0) return 'text-red-600 font-semibold';
    return 'text-gray-600';
  };

  const totals = memberAnalytics.reduce(
    (acc, member) => ({
      totalPaid: acc.totalPaid + member.totalPaid,
      totalShare: acc.totalShare + member.totalShare,
    }),
    { totalPaid: 0, totalShare: 0 }
  );

  if (memberAnalytics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Analytics</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No member data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Member Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Overview of all members' expenses and balances</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('userName')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Member</span>
                  {getSortIcon('userName')}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalPaid')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Total Paid</span>
                  {getSortIcon('totalPaid')}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalShare')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Total Share</span>
                  {getSortIcon('totalShare')}
                </div>
              </th>
              <th
                onClick={() => handleSort('balance')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Balance</span>
                  {getSortIcon('balance')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAnalytics.map((member) => (
              <tr key={member.userId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {member.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatCurrency(member.totalPaid)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatCurrency(member.totalShare)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <span className={getBalanceColor(member.balance)}>
                    {formatCurrency(member.balance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                {formatCurrency(totals.totalPaid)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                {formatCurrency(totals.totalShare)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex items-center justify-end space-x-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-600 rounded mr-1"></div>
          <span>Owed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-600 rounded mr-1"></div>
          <span>Owes</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-600 rounded mr-1"></div>
          <span>Settled</span>
        </div>
      </div>
    </div>
  );
};

export default MemberAnalyticsTable;
