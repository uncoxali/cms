import { create } from 'zustand';
import { api } from '@/lib/api';

export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'flow.run';

export interface ActivityLog {
    id: string;
    action: ActivityAction;
    collection?: string;
    item?: string | number;
    user: string;
    timestamp: string;
    meta?: any;
}

interface ActivityState {
    logs: ActivityLog[];
    loading: boolean;
    fetchLogs: (params?: { action?: string; collection?: string; limit?: number }) => Promise<void>;
    addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>;
    clearLogs: () => void;
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
    logs: [],
    loading: false,

    fetchLogs: async (params) => {
        set({ loading: true });
        try {
            const token = api.getToken();
            if (!token) { set({ loading: false }); return; }

            const queryParams: Record<string, string> = {};
            if (params?.action && params.action !== 'all') queryParams.action = params.action;
            if (params?.collection) queryParams.collection = params.collection;
            if (params?.limit) queryParams.limit = String(params.limit);

            const res = await api.get<{ data: any[] }>('/activity', queryParams);
            const logs: ActivityLog[] = (res.data || []).map((l: any) => ({
                id: String(l.id),
                action: l.action as ActivityAction,
                collection: l.collection || undefined,
                item: l.item || undefined,
                user: l.user || 'Unknown',
                timestamp: l.timestamp,
                meta: l.meta || undefined,
            }));
            set({ logs, loading: false });
        } catch (err) {
            console.error('[ActivityStore] fetch error:', err);
            set({ loading: false });
        }
    },

    addLog: async (logInput) => {
        // Optimistic local update
        const localLog = {
            ...logInput,
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString()
        };
        set((state) => ({ logs: [localLog, ...state.logs] }));

        // Write to DB
        try {
            const token = api.getToken();
            if (token) {
                await api.post('/activity', {
                    action: logInput.action,
                    user: logInput.user,
                    collection: logInput.collection,
                    item: logInput.item,
                    meta: logInput.meta,
                });
            }
        } catch (err) {
            console.error('[ActivityStore] addLog to DB error:', err);
            // Local log stays as fallback
        }
    },

    clearLogs: () => set({ logs: [] })
}));
