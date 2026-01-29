import React from 'react';
import { MessSettings } from '../components/mess';
import { useMessStore } from '../store/messStore';

const MembersPage: React.FC = () => {
  const { currentMess } = useMessStore();

  if (!currentMess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Mess Selected</h2>
          <p className="text-gray-500">Please select or create a mess to manage members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Members & Settings</h1>
        <p className="text-gray-600">Manage mess members, roles, and settings</p>
      </div>

      <MessSettings mess={currentMess} />
    </div>
  );
};

export default MembersPage;
