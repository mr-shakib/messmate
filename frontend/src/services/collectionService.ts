import api from './api';
import {
    MoneyCollection,
    CreateCollectionDTO,
    CollectionFilters,
    PaginatedResponse
} from '../types';

class CollectionService {
    /**
     * Record a new money collection
     */
    async recordCollection(data: CreateCollectionDTO): Promise<MoneyCollection> {
        const response = await api.post<any>('/collections', data);
        return {
            ...response.data.data,
            date: new Date(response.data.data.date),
            createdAt: new Date(response.data.data.createdAt),
            updatedAt: new Date(response.data.data.updatedAt)
        };
    }

    /**
     * Get collections/contributions
     */
    async getCollections(
        messId: string,
        filters: CollectionFilters = {}
    ): Promise<PaginatedResponse<MoneyCollection>> {
        const params: any = { messId, ...filters };

        // Convert dates to ISO strings if present
        if (params.startDate) params.startDate = params.startDate.toISOString();
        if (params.endDate) params.endDate = params.endDate.toISOString();

        const response = await api.get<any>('/collections', { params });

        // Transform dates in response
        const collections = response.data.data.data.map((collection: any) => ({
            ...collection,
            date: new Date(collection.date),
            createdAt: new Date(collection.createdAt),
            updatedAt: new Date(collection.updatedAt)
        }));

        return {
            data: collections,
            pagination: response.data.data.pagination
        };
    }

    /**
     * Get total collected amount
     */
    async getTotalCollected(
        messId: string,
        period?: { startDate: Date; endDate: Date }
    ): Promise<number> {
        const params: any = { messId };

        if (period) {
            if (period.startDate) params.startDate = period.startDate.toISOString();
            if (period.endDate) params.endDate = period.endDate.toISOString();
        }

        const response = await api.get<any>('/collections/total', { params });
        return response.data.data.total;
    }

    /**
     * Delete a collection
     */
    async deleteCollection(collectionId: string): Promise<void> {
        await api.delete(`/collections/${collectionId}`);
    }
}

export default new CollectionService();
