import React from 'react';
import { MessList, CreateMessModal, JoinMessModal } from '../components/mess';
import { useUIStore } from '../store/uiStore';

const MessesPage: React.FC = () => {
  const { openModal, closeModal, isModalOpen } = useUIStore();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Messes</h1>
        <p className="text-gray-600">
          Manage your shared living spaces and expenses
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => openModal('createMess')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Create New Mess</span>
        </button>

        <button
          onClick={() => openModal('joinMess')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <span>Join Existing Mess</span>
        </button>
      </div>

      {/* Mess List */}
      <MessList />

      {/* Modals */}
      {isModalOpen('createMess') && (
        <CreateMessModal 
          isOpen={isModalOpen('createMess')}
          onClose={() => closeModal('createMess')} 
        />
      )}

      {isModalOpen('joinMess') && (
        <JoinMessModal 
          isOpen={isModalOpen('joinMess')}
          onClose={() => closeModal('joinMess')} 
        />
      )}
    </div>
  );
};

export default MessesPage;
