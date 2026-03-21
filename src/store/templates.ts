import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Template {
    id: string;
    name: string;
    description: string;
    collection: string;
    data: Record<string, any>;
    category: string;
    createdAt: string;
    updatedAt: string;
}

interface TemplatesState {
    templates: Template[];
    loading: boolean;
    error: string | null;
    fetchTemplates: (collection?: string) => Promise<void>;
    createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
    updateTemplate: (id: string, data: Partial<Template>) => Promise<boolean>;
    deleteTemplate: (id: string) => Promise<boolean>;
}

export const useTemplatesStore = create<TemplatesState>()((set, get) => ({
    templates: [],
    loading: false,
    error: null,

    fetchTemplates: async (collection) => {
        set({ loading: true, error: null });
        try {
            const params: Record<string, string> = {};
            if (collection) params.collection = collection;

            const res = await api.get<{ data: Template[] }>('/templates', params);
            set({ templates: res.data || [], loading: false });
        } catch (err: any) {
            console.error('[TemplatesStore] fetch error:', err);
            set({ error: err.message || 'Failed to fetch templates', loading: false });
        }
    },

    createTemplate: async (template) => {
        try {
            await api.post('/templates', template);
            await get().fetchTemplates();
            return true;
        } catch (err: any) {
            console.error('[TemplatesStore] create error:', err);
            set({ error: err.message || 'Failed to create template' });
            return false;
        }
    },

    updateTemplate: async (id, data) => {
        try {
            await api.patch(`/templates/${id}`, data);
            await get().fetchTemplates();
            return true;
        } catch (err: any) {
            console.error('[TemplatesStore] update error:', err);
            set({ error: err.message || 'Failed to update template' });
            return false;
        }
    },

    deleteTemplate: async (id) => {
        try {
            await api.del(`/templates/${id}`);
            set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
            return true;
        } catch (err: any) {
            console.error('[TemplatesStore] delete error:', err);
            set({ error: err.message || 'Failed to delete template' });
            return false;
        }
    },
}));
