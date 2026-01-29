import React, { useState } from 'react';
import type { CategoryBreakdown } from '../../types';

interface CategoryChartProps {
  categoryBreakdown: CategoryBreakdown[];
}

const CategoryChart: React.FC<CategoryChartProps> = ({ categoryBreakdown }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Color palette for categories
  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    Groceries: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-700' },
    Utilities: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-700' },
    Rent: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-700' },
    Food: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-700' },
    Entertainment: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-700' },
    Other: { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-700' },
  };

  const totalAmount = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);

  if (categoryBreakdown.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No expenses recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
      
      {/* Bar Chart */}
      <div className="space-y-3 mb-6">
        {categoryBreakdown.map((category) => {
          const colors = categoryColors[category.category] || categoryColors.Other;
          const isHovered = hoveredCategory === category.category;
          
          return (
            <div
              key={category.category}
              className="relative"
              onMouseEnter={() => setHoveredCategory(category.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{category.category}</span>
                <span className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</span>
              </div>
              
              <div className="relative w-full h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bg} transition-all duration-300 ease-in-out flex items-center justify-end pr-3`}
                  style={{ width: `${category.percentage}%` }}
                >
                  {category.percentage > 15 && (
                    <span className="text-xs font-medium text-white">
                      {formatCurrency(category.amount)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute z-10 left-0 top-full mt-2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                  <div className="font-semibold mb-1">{category.category}</div>
                  <div>Amount: {formatCurrency(category.amount)}</div>
                  <div>Count: {category.count} transaction{category.count !== 1 ? 's' : ''}</div>
                  <div>Percentage: {category.percentage.toFixed(1)}%</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2">
          {categoryBreakdown.map((category) => {
            const colors = categoryColors[category.category] || categoryColors.Other;
            return (
              <div key={category.category} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors.bg} mr-2`}></div>
                <span className="text-xs text-gray-600">
                  {category.category} ({category.count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;
