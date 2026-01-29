import React, { useState } from 'react';
import { useMessStore } from '../../store/messStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import type { Mess } from '../../types';

interface CreateMessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (mess: Mess) => void;
}

interface FormData {
  name: string;
  memberLimit: number;
  description: string;
}

interface FormErrors {
  name?: string;
  memberLimit?: string;
  description?: string;
}

export const CreateMessModal: React.FC<CreateMessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addMess, setCurrentMess } = useMessStore();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    memberLimit: 10,
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Mess name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Mess name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Mess name must not exceed 50 characters';
    }

    // Validate member limit (6-20 as per requirements)
    if (formData.memberLimit < 6) {
      newErrors.memberLimit = 'Member limit must be at least 6';
    } else if (formData.memberLimit > 20) {
      newErrors.memberLimit = 'Member limit must not exceed 20';
    }

    // Validate description (optional but has max length)
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must not exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: Mess }>('/messes', {
        name: formData.name.trim(),
        memberLimit: formData.memberLimit,
        description: formData.description.trim() || undefined,
      });

      const newMess = response.data.data;

      // Add to store
      addMess(newMess);
      setCurrentMess(newMess);

      // Show success message
      addToast('Mess created successfully!', 'success');

      // Call success callback
      onSuccess?.(newMess);

      // Reset form and close modal
      handleClose();
    } catch (error: any) {
      console.error('Failed to create mess:', error);
      // Error toast is handled by API interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        memberLimit: 10,
        description: '',
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'memberLimit' ? parseInt(value) || 0 : value,
    }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Mess
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mess Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mess Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                `}
                placeholder="Enter mess name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Member Limit */}
            <div>
              <label
                htmlFor="memberLimit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Member Limit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="memberLimit"
                name="memberLimit"
                value={formData.memberLimit}
                onChange={handleInputChange}
                disabled={isSubmitting}
                min={6}
                max={20}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors.memberLimit
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                `}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be between 6 and 20 members
              </p>
              {errors.memberLimit && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.memberLimit}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  resize-none
                `}
                placeholder="Enter a brief description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Mess'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
