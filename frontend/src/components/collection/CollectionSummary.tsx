import React from 'react';

interface CollectionSummaryProps {
    totalCollected: number;
}

export const CollectionSummary: React.FC<CollectionSummaryProps> = ({ totalCollected }) => {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold opacity-90">Total Collected</h2>
                    <p className="text-3xl font-bold mt-1">
                        Tk {new Intl.NumberFormat('en-US').format(totalCollected)}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-sm font-medium opacity-90">Current Month</p>
                </div>
            </div>
        </div>
    );
};
