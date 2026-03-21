import { create } from 'zustand';
import { api } from '@/lib/api';

export interface AnalyticsData {
    overview: {
        totalItems: number;
        totalUsers: number;
        totalFiles: number;
        totalViews: number;
        itemsGrowth: number;
        usersGrowth: number;
        filesGrowth: number;
    };
    contentByCollection: {
        collection: string;
        label: string;
        count: number;
        created: number;
        updated: number;
    }[];
    activityTimeline: {
        date: string;
        creates: number;
        updates: number;
        deletes: number;
        logins: number;
    }[];
    topUsers: {
        name: string;
        email: string;
        actions: number;
        lastActive: string;
    }[];
    recentMetrics: {
        label: string;
        value: number;
        change: number;
        trend: 'up' | 'down' | 'neutral';
    }[];
}

interface AnalyticsState {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
    dateRange: '7d' | '30d' | '90d' | 'all';
    setDateRange: (range: '7d' | '30d' | '90d' | 'all') => void;
    fetchAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
    data: null,
    loading: false,
    error: null,
    dateRange: '30d',

    setDateRange: (range) => set({ dateRange: range }),

    fetchAnalytics: async () => {
        set({ loading: true, error: null });
        try {
            const { dateRange } = get();
            const res = await api.get<{ data: AnalyticsData }>('/analytics', { range: dateRange });
            set({ data: res.data, loading: false });
        } catch (err: any) {
            console.error('[AnalyticsStore] fetch error:', err);
            set({ error: err.message || 'Failed to fetch analytics', loading: false });
        }
    },
}));
