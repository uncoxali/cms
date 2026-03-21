import { create } from 'zustand';
import { api } from '@/lib/api';

export interface TrashedItem {
    id: string;
    collection: string;
    collectionLabel: string;
    data: Record<string, any>;
    deletedBy: string;
    deletedAt: string;
    expiresAt: string;
}

interface TrashState {
    items: TrashedItem[];
    loading: boolean;
    error: string | null;
    filter: string;
    setFilter: (collection: string) => void;
    fetchTrash: () => Promise<void>;
    restoreItem: (id: string) => Promise<boolean>;
    permanentDelete: (id: string) => Promise<boolean>;
    emptyTrash: () => Promise<boolean>;
}

export const useTrashStore = create<TrashState>()((set, get) => ({
    items: [],
    loading: false,
    error: null,
    filter: 'all',

    setFilter: (collection) => set({ filter: collection }),

    fetchTrash: async () => {
        set({ loading: true, error: null });
        try {
            const { filter } = get();
            const params: Record<string, string> = {};
            if (filter && filter !== 'all') params.collection = filter;

            const res = await api.get<{ data: TrashedItem[] }>('/trash', params);
            set({ items: res.data || [], loading: false });
        } catch (err: any) {
            console.error('[TrashStore] fetch error:', err);
            set({ error: err.message || 'Failed to fetch trash', loading: false });
        }
    },

    restoreItem: async (id) => {
        try {
            await api.post(`/trash/${id}`, { action: 'restore' });
            set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
            return true;
        } catch (err: any) {
            console.error('[TrashStore] restore error:', err);
            set({ error: err.message || 'Failed to restore item' });
            return false;
        }
    },

    permanentDelete: async (id) => {
        try {
            await api.del(`/trash/${id}`);
            set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
            return true;
        } catch (err: any) {
            console.error('[TrashStore] delete error:', err);
            set({ error: err.message || 'Failed to delete item' });
            return false;
        }
    },

    emptyTrash: async () => {
        try {
            await api.post('/trash', { action: 'empty' });
            set({ items: [] });
            return true;
        } catch (err: any) {
            console.error('[TrashStore] empty error:', err);
            set({ error: err.message || 'Failed to empty trash' });
            return false;
        }
    },
}));
