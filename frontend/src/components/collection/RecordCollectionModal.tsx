import React, { useState } from 'react';
import { useMessStore } from '../../store/messStore';
import { useUIStore } from '../../store/uiStore';
import collectionService from '../../services/collectionService';

interface RecordCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RecordCollectionModal: React.FC<RecordCollectionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { currentMess } = useMessStore();
    const { addToast } = useUIStore();

    const [memberId, setMemberId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMess) return;

        if (!memberId) {
            addToast('Please select a member', 'error');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await collectionService.recordCollection({
                messId: currentMess.id,
                memberId,
                amount: parseFloat(amount),
                date: new Date(date),
                description: description.trim() || 'Monthly contribution'
            });

            addToast('Collection recorded successfully', 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to record collection:', error);
            // Toast handled by API interceptor usually
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setMemberId('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        onClose();
    };

    if (!isOpen || !currentMess) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={handleClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Record Money Collection</h3>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="member" className="block text-sm font-medium text-gray-700">Member</label>
                            <select
                                id="member"
                                value={memberId}
                                onChange={(e) => setMemberId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                required
                            >
                                <option value="">Select a member</option>
                                {currentMess.members.map((member) => (
                                    <option key={member.userId} value={member.userId}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">Tk</span>
                                </div>
                                <input
                                    type="number"
                                    id="amount"
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="block w-full pl-9 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                                type="text"
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="e.g. Monthly contribution"
                            />
                        </div>

                        <div className="mt-5 sm:mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Recording...' : 'Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
