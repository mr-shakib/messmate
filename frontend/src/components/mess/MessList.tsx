import React from 'react';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import type { Mess } from '../../types';

interface MessListProps {
  onMessSelect?: (mess: Mess) => void;
}

export const MessList: React.FC<MessListProps> = ({ onMessSelect }) => {
  const { messes, currentMess, setCurrentMess, isLoading } = useMessStore();
  const { user } = useAuthStore();

  const handleMessClick = (mess: Mess) => {
    setCurrentMess(mess);
    onMessSelect?.(mess);
  };

  const getUserRole = (mess: Mess): string => {
    if (!user) return 'Member';
    const member = mess.members.find((m) => m.userId === user.id);
    return member?.role || 'Member';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (messes.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p className="text-lg mb-2">No messes found</p>
        <p className="text-sm">Create a new mess or join one using an invite code</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messes.map((mess) => {
        const isSelected = currentMess?.id === mess.id;
        const userRole = getUserRole(mess);
        const memberCount = mess.members.length;

        return (
          <div
            key={mess.id}
            onClick={() => handleMessClick(mess)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {mess.name}
                </h3>
                {mess.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {mess.description}
                  </p>
                )}
              </div>
              <div
                className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${
                    userRole === 'Owner'
                      ? 'bg-purple-100 text-purple-800'
                      : userRole === 'Admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }
                `}
              >
                {userRole}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>
                  {memberCount} / {mess.memberLimit} members
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Joined {new Date(mess.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
