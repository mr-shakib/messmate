import React from 'react';
import { BalanceSummary } from '../components/balance';
import { SettlementHistory, SettlementSuggestions, SettlementModal } from '../components/settlement';
import { useUIStore } from '../store/uiStore';
import { useMessStore } from '../store/messStore';

const SettlementsPage: React.FC = () => {
  const { openModal, closeModal, isModalOpen } = useUIStore();
  const { currentMess } = useMessStore();

  if (!currentMess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Mess Selected</h2>
          <p className="text-gray-500">Please select or create a mess to manage settlements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settlements</h1>
          <p className="text-gray-600">Manage payments and balance settlements</p>
        </div>
        <button
          onClick={() => openModal('recordSettlement')}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Record Settlement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Summary</h2>
          <BalanceSummary />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Settlement Suggestions</h2>
          <SettlementSuggestions />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Settlement History</h2>
        <SettlementHistory />
      </div>

      {isModalOpen('recordSettlement') && (
        <SettlementModal 
          isOpen={isModalOpen('recordSettlement')}
          onClose={() => closeModal('recordSettlement')} 
        />
      )}
    </div>
  );
};

export default SettlementsPage;
