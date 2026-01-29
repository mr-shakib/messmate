import React, { useState } from 'react';
import { useMessStore } from '../../store/messStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import type { Mess } from '../../types';

interface JoinMessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (mess: Mess) => void;
}

type JoinMethod = 'code' | 'link';

export const JoinMessModal: React.FC<JoinMessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addMess, setCurrentMess } = useMessStore();
  const { addToast } = useUIStore();

  const [joinMethod, setJoinMethod] = useState<JoinMethod>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post<{ data: Mess }>('/messes/join/code', {
        inviteCode: inviteCode.trim().toUpperCase(),
      });

      const joinedMess = response.data.data;

      // Add to store
      addMess(joinedMess);
      setCurrentMess(joinedMess);

      addToast(`Successfully joined ${joinedMess.name}!`, 'success');

      // Call success callback
      onSuccess?.(joinedMess);

      // Reset and close
      handleClose();
    } catch (error: any) {
      console.error('Failed to join mess by code:', error);
      const errorMessage =
        error.response?.data?.error?.message ||
        'Failed to join mess. Please check the invite code and try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinByLink = async () => {
    if (!inviteLink.trim()) {
      setError('Please enter an invite link');
      return;
    }

    // Extract token from link if it's a full URL
    let token = inviteLink.trim();
    try {
      const url = new URL(inviteLink);
      const pathParts = url.pathname.split('/');
      token = pathParts[pathParts.length - 1] || token;
    } catch {
      // Not a valid URL, assume it's just the token
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post<{ data: Mess }>('/messes/join/link', {
        inviteLinkToken: token,
      });

      const joinedMess = response.data.data;

      // Add to store
      addMess(joinedMess);
      setCurrentMess(joinedMess);

      addToast(`Successfully joined ${joinedMess.name}!`, 'success');

      // Call success callback
      onSuccess?.(joinedMess);

      // Reset and close
      handleClose();
    } catch (error: any) {
      console.error('Failed to join mess by link:', error);
      const errorMessage =
        error.response?.data?.error?.message ||
        'Failed to join mess. The invite link may be invalid or expired.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (joinMethod === 'code') {
      handleJoinByCode();
    } else {
      handleJoinByLink();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setInviteCode('');
      setInviteLink('');
      setError(null);
      setJoinMethod('code');
      onClose();
    }
  };

  const handleMethodChange = (method: JoinMethod) => {
    setJoinMethod(method);
    setError(null);
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
            <h2 className="text-2xl font-bold text-gray-900">Join a Mess</h2>
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

          {/* Method Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => handleMethodChange('code')}
              disabled={isSubmitting}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  joinMethod === 'code'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Invite Code
            </button>
            <button
              onClick={() => handleMethodChange('link')}
              disabled={isSubmitting}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  joinMethod === 'link'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Invite Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {joinMethod === 'code' ? (
              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter Invite Code
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="e.g., ABC12345"
                  maxLength={8}
                  className={`
                    w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                    text-center text-2xl font-mono font-bold tracking-wider uppercase
                    ${
                      error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                  `}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Ask the mess owner for the 8-character invite code
                </p>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="inviteLink"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter Invite Link
                </label>
                <input
                  type="text"
                  id="inviteLink"
                  value={inviteLink}
                  onChange={(e) => {
                    setInviteLink(e.target.value);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Paste the invite link here"
                  className={`
                    w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                    ${
                      error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                  `}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Paste the full invite link you received
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Note:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You can be a member of multiple messes</li>
                    <li>Invite codes never expire</li>
                    <li>Invite links may have expiration times</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
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
                    Joining...
                  </>
                ) : (
                  'Join Mess'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
