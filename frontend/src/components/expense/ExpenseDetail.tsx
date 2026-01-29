import React, { useState } from 'react';
import type { Expense } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useMessStore } from '../../store/messStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';

interface ExpenseDetailProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export const ExpenseDetail: React.FC<ExpenseDetailProps> = ({
  expense,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const { currentMess, getCurrentUserRole } = useMessStore();
  const { addToast } = useUIStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userRole = user ? getCurrentUserRole(user.id) : null;
  const isCreator = user?.id === expense.createdBy.id;
  const canEdit = userRole === 'Owner' || userRole === 'Admin' || isCreator;
  const canDelete = userRole === 'Owner' || userRole === 'Admin' || isCreator;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Groceries: 'bg-green-100 text-green-800',
      Utilities: 'bg-blue-100 text-blue-800',
      Rent: 'bg-purple-100 text-purple-800',
      Food: 'bg-orange-100 text-orange-800',
      Entertainment: 'bg-pink-100 text-pink-800',
      Other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.Other;
  };

  const handleDelete = async () => {
    if (!currentMess) return;

    setIsDeleting(true);
    try {
      await api.delete(`/expenses/${expense.id}`);
      addToast('Expense deleted successfully', 'success');
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      // Error toast is handled by API interceptor
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Expense Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-2xl font-semibold text-gray-900">
                    {expense.description}
                  </h4>
                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                        expense.category
                      )}`}
                    >
                      {expense.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatAmount(expense.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Paid By */}
            <div className="border-t border-gray-200 pt-4">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Paid By
              </h5>
              <div className="mt-2 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {expense.paidBy.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {expense.paidBy.name}
                  </p>
                  <p className="text-sm text-gray-500">{expense.paidBy.email}</p>
                </div>
              </div>
            </div>

            {/* Split Method */}
            <div className="border-t border-gray-200 pt-4">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Split Method
              </h5>
              <p className="mt-2 text-sm text-gray-900 capitalize">
                {expense.splitMethod}
              </p>
            </div>

            {/* Split Breakdown */}
            <div className="border-t border-gray-200 pt-4">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Split Breakdown
              </h5>
              <div className="space-y-2">
                {expense.splits.map((split) => (
                  <div
                    key={split.user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-xs">
                          {split.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {split.user.name}
                        </p>
                        {split.percentage && (
                          <p className="text-xs text-gray-500">
                            {split.percentage.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatAmount(split.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created By</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {expense.createdBy.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created At</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(expense.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div>
              {canDelete && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                >
                  Delete
                </button>
              )}
              {showDeleteConfirm && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {canEdit && (
                <button
                  onClick={() => {
                    onUpdate?.();
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
