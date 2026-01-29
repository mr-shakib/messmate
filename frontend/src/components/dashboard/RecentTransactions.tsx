import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TransactionInfo } from '../../types';

interface RecentTransactionsProps {
  transactions: TransactionInfo[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);

    if (transactionDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        day: 'numeric',
        year: transactionDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      }).format(new Date(date));
    }
  };

  const handleTransactionClick = (transaction: TransactionInfo) => {
    if (transaction.type === 'expense') {
      navigate(`/expenses/${transaction.id}`);
    } else if (transaction.type === 'settlement') {
      navigate(`/settlements`);
    }
  };

  const getTransactionIcon = (type: 'expense' | 'settlement') => {
    if (type === 'expense') {
      return (
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No transactions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <span className="text-sm text-gray-500">Last 10 transactions</span>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={`${transaction.type}-${transaction.id}`}
            onClick={() => handleTransactionClick(transaction)}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150"
          >
            <div className="flex items-center flex-1 min-w-0">
              {getTransactionIcon(transaction.type)}
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.description}
                  </p>
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                    transaction.type === 'expense' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {transaction.type === 'expense' ? 'Expense' : 'Settlement'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>

            <div className="ml-4 flex-shrink-0 text-right">
              <p className={`text-sm font-semibold ${
                transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => navigate('/expenses')}
          className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Transactions →
        </button>
      </div>
    </div>
  );
};

export default RecentTransactions;
