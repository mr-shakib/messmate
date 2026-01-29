import React from 'react';
import { ExpenseList, ExpenseFilters, CreateExpenseModal } from '../components/expense';
import { useUIStore } from '../store/uiStore';
import { useMessStore } from '../store/messStore';

const ExpensesPage: React.FC = () => {
  const { openModal, closeModal, isModalOpen } = useUIStore();
  const { currentMess } = useMessStore();

  if (!currentMess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Mess Selected</h2>
          <p className="text-gray-500">Please select or create a mess to manage expenses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expenses</h1>
          <p className="text-gray-600">Track and manage shared expenses</p>
        </div>
        <button
          onClick={() => openModal('createExpense')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Expense</span>
        </button>
      </div>

      <div className="mb-6">
        <ExpenseFilters onFiltersChange={(filters) => {
          // TODO: Apply filters to expense list
          console.log('Filters changed:', filters);
        }} />
      </div>

      <ExpenseList />

      {isModalOpen('createExpense') && (
        <CreateExpenseModal 
          isOpen={isModalOpen('createExpense')}
          onClose={() => closeModal('createExpense')} 
        />
      )}
    </div>
  );
};

export default ExpensesPage;
