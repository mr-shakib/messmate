import React, { useState } from 'react';
import type { ExpenseCategory, ExpenseFilters as ExpenseFiltersType } from '../../types';
import { useMessStore } from '../../store/messStore';

interface ExpenseFiltersProps {
  onFiltersChange: (filters: ExpenseFiltersType) => void;
  initialFilters?: ExpenseFiltersType;
}

const CATEGORIES: ExpenseCategory[] = [
  'Groceries',
  'Utilities',
  'Rent',
  'Food',
  'Entertainment',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'category', label: 'Category' },
];

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
}) => {
  const { currentMess } = useMessStore();
  
  const [startDate, setStartDate] = useState<string>(
    initialFilters.startDate ? new Date(initialFilters.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState<string>(
    initialFilters.endDate ? new Date(initialFilters.endDate).toISOString().split('T')[0] : ''
  );
  const [category, setCategory] = useState<ExpenseCategory | ''>(
    initialFilters.category || ''
  );
  const [memberId, setMemberId] = useState<string>(initialFilters.memberId || '');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>(
    initialFilters.sortBy || 'date'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    initialFilters.sortOrder || 'desc'
  );

  const handleApplyFilters = () => {
    const filters: ExpenseFiltersType = {
      sortBy,
      sortOrder,
    };

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    if (category) {
      filters.category = category;
    }
    if (memberId) {
      filters.memberId = memberId;
    }

    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setMemberId('');
    setSortBy('date');
    setSortOrder('desc');
    
    onFiltersChange({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Member */}
        <div>
          <label htmlFor="member" className="block text-sm font-medium text-gray-700">
            Member
          </label>
          <select
            id="member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Members</option>
            {currentMess?.members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};
