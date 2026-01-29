import React, { useEffect, useState } from 'react';

interface ExpenseSummaryCardProps {
  currentMonthTotal: number;
  userBalance: number;
}

const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({
  currentMonthTotal,
  userBalance,
}) => {
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [trendPercentage, setTrendPercentage] = useState<number>(0);

  useEffect(() => {
    // Calculate trend based on comparison with previous month
    // For now, we'll simulate this - in a real app, this would come from the API
    const simulatedPreviousMonth = currentMonthTotal * 0.85; // Simulate 15% increase

    if (simulatedPreviousMonth === 0) {
      setTrend('neutral');
      setTrendPercentage(0);
    } else {
      const change = currentMonthTotal - simulatedPreviousMonth;
      const percentage = Math.abs((change / simulatedPreviousMonth) * 100);
      
      setTrendPercentage(Math.round(percentage));
      
      if (change > 0) {
        setTrend('up');
      } else if (change < 0) {
        setTrend('down');
      } else {
        setTrend('neutral');
      }
    }
  }, [currentMonthTotal]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBalanceStatus = () => {
    if (userBalance > 0) {
      return { text: 'You are owed', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (userBalance < 0) {
      return { text: 'You owe', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else {
      return { text: 'Settled', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Summary</h2>
      
      {/* Current Month Total */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-1">Current Month Total</p>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(currentMonthTotal)}
          </p>
          
          {/* Trend Indicator */}
          {trend !== 'neutral' && (
            <div className={`flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-red-600' : 'text-green-600'
            }`}>
              {trend === 'up' ? (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{trendPercentage}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {trend === 'up' && `${trendPercentage}% more than last month`}
          {trend === 'down' && `${trendPercentage}% less than last month`}
          {trend === 'neutral' && 'Same as last month'}
        </p>
      </div>

      {/* User Balance */}
      <div className={`${balanceStatus.bgColor} rounded-lg p-4`}>
        <p className="text-sm text-gray-600 mb-1">{balanceStatus.text}</p>
        <p className={`text-2xl font-bold ${balanceStatus.color}`}>
          {formatCurrency(Math.abs(userBalance))}
        </p>
        {userBalance !== 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {userBalance > 0 
              ? 'Other members owe you this amount' 
              : 'You need to settle this amount'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpenseSummaryCard;
