import React from 'react';
import { CollectionFilters } from '../../types';

interface CollectionFiltersProps {
    filters: CollectionFilters;
    onFilterChange: (filters: CollectionFilters) => void;
    members: Array<{ id: string; name: string }>;
}

export const CollectionFiltersList: React.FC<CollectionFiltersProps> = ({
    filters,
    onFilterChange,
    members
}) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
            <div className="flex items-center gap-2">
                <label htmlFor="member" className="text-sm font-medium text-gray-700">Member:</label>
                <select
                    id="member"
                    className="border border-gray-300 rounded-md text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.memberId || ''}
                    onChange={(e) => onFilterChange({ ...filters, memberId: e.target.value || undefined })}
                >
                    <option value="">All Members</option>
                    {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Date Range filters could go here */}
        </div>
    );
};
