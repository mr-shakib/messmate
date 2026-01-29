import React, { useState, useEffect } from 'react';
import { useMessStore } from '../store/messStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import collectionService from '../services/collectionService';
import { CollectionList, CollectionSummary, CollectionFiltersList, RecordCollectionModal } from '../components/collection';
import { MoneyCollection, CollectionFilters } from '../types';

const CollectionsPage: React.FC = () => {
    const { currentMess } = useMessStore();
    const { user } = useAuthStore();
    const { addToast } = useUIStore();

    const [collections, setCollections] = useState<MoneyCollection[]>([]);
    const [totalCollected, setTotalCollected] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<CollectionFilters>({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCollections = async () => {
        if (!currentMess) return;

        setIsLoading(true);
        try {
            const [response, total] = await Promise.all([
                collectionService.getCollections(currentMess.id, filters),
                collectionService.getTotalCollected(currentMess.id)
            ]);
            setCollections(response.data);
            setTotalCollected(total);
        } catch (error) {
            console.error('Failed to fetch collections:', error);
            addToast('Failed to load collections', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentMess) {
            fetchCollections();
        }
    }, [currentMess, filters]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this collection?')) return;

        try {
            await collectionService.deleteCollection(id);
            addToast('Collection deleted successfully', 'success');
            fetchCollections();
        } catch (error) {
            console.error('Failed to delete collection:', error);
            addToast('Failed to delete collection', 'error');
        }
    };

    const isOwner = currentMess?.members.find(m => m.userId === user?.id)?.role === 'Owner';

    if (!currentMess) {
        return <div className="p-6 text-center text-gray-500">Please select a mess first.</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Money Collections</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Record Collection
                </button>
            </div>

            <CollectionSummary totalCollected={totalCollected} />

            <CollectionFiltersList
                filters={filters}
                onFilterChange={setFilters}
                members={currentMess.members.map(m => ({ id: m.userId, name: m.name }))}
            />

            <CollectionList
                collections={collections}
                isLoading={isLoading}
                onDelete={handleDelete}
                currentUserId={user?.id || ''}
                isOwner={!!isOwner}
            />

            <RecordCollectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCollections}
            />
        </div>
    );
};

export default CollectionsPage;
