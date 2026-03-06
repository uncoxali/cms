import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface ProjectSettings {
    projectName: string;
    projectDescription: string;
    projectUrl: string;
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    defaultLanguage: string;
    timezone: string;
    defaultPageSize: number;
    defaultSortField: string;
    defaultSortOrder: 'asc' | 'desc';
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
    featureFlags: {
        insights: boolean;
        files: boolean;
        flows: boolean;
        activity: boolean;
        extensions: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    fontFamily: string;
    sessionTimeout: number;
    minPasswordLength: number;
    allowedOrigins: string;
}

export interface FileSettings {
    thumbnailSizes: { name: string; width: number; height: number }[];
    allowedMimeTypes: string[];
    maxFileSize: number;
    defaultFolder: string;
    imageOptimization: boolean;
}

interface ProjectState {
    settings: ProjectSettings;
    fileSettings: FileSettings;
    loading: boolean;
    fetched: boolean;
    fetchSettings: () => Promise<void>;
    updateSettings: (updates: Partial<ProjectSettings>) => Promise<void>;
    updateFileSettings: (updates: Partial<FileSettings>) => void;
    updateFeatureFlag: (flag: keyof ProjectSettings['featureFlags'], value: boolean) => Promise<void>;
}

const DEFAULT_SETTINGS: ProjectSettings = {
    projectName: 'NexDirect CMS',
    projectDescription: 'A headless content management system inspired by Neurofy.',
    projectUrl: 'http://localhost:3000',
    logoUrl: '',
    primaryColor: '#6644ff',
    accentColor: '#2ecfa1',
    defaultLanguage: 'en-US',
    timezone: 'UTC',
    defaultPageSize: 25,
    defaultSortField: 'date_created',
    defaultSortOrder: 'desc',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    numberFormat: '1,000.00',
    featureFlags: {
        insights: true,
        files: true,
        flows: true,
        activity: true,
        extensions: true,
    },
    theme: 'dark',
    fontFamily: 'Inter',
    sessionTimeout: 30,
    minPasswordLength: 8,
    allowedOrigins: '*',
};

const DEFAULT_FILE_SETTINGS: FileSettings = {
    thumbnailSizes: [
        { name: 'Small', width: 64, height: 64 },
        { name: 'Medium', width: 300, height: 300 },
        { name: 'Large', width: 800, height: 600 },
    ],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4'],
    maxFileSize: 10,
    defaultFolder: 'uploads',
    imageOptimization: true,
};

function mapDbSettings(data: any): Partial<ProjectSettings> {
    return {
        projectName: data.project_name || DEFAULT_SETTINGS.projectName,
        projectDescription: data.project_description || DEFAULT_SETTINGS.projectDescription,
        primaryColor: data.project_color || DEFAULT_SETTINGS.primaryColor,
        defaultLanguage: data.default_locale || DEFAULT_SETTINGS.defaultLanguage,
        timezone: data.default_timezone || DEFAULT_SETTINGS.timezone,
        theme: data.theme || DEFAULT_SETTINGS.theme,
        fontFamily: data.default_font || DEFAULT_SETTINGS.fontFamily,
        defaultPageSize: data.default_page_size || DEFAULT_SETTINGS.defaultPageSize,
        defaultSortField: data.default_sort_field || DEFAULT_SETTINGS.defaultSortField,
        defaultSortOrder: data.default_sort_order || DEFAULT_SETTINGS.defaultSortOrder,
        dateFormat: data.date_format || DEFAULT_SETTINGS.dateFormat,
        numberFormat: data.number_format || DEFAULT_SETTINGS.numberFormat,
        featureFlags: data.feature_flags || DEFAULT_SETTINGS.featureFlags,
        logoUrl: data.project_logo || '',
    };
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            fileSettings: DEFAULT_FILE_SETTINGS,
            loading: false,
            fetched: false,

            fetchSettings: async () => {
                if (get().loading) return;
                set({ loading: true });
                try {
                    const token = api.getToken();
                    if (!token) { set({ loading: false }); return; }
                    const res = await api.get<{ data: any }>('/settings');
                    if (res.data) {
                        const dbSettings = mapDbSettings(res.data);
                        set((state) => ({
                            settings: { ...state.settings, ...dbSettings },
                            loading: false,
                            fetched: true,
                        }));
                    } else {
                        set({ loading: false, fetched: true });
                    }
                } catch (err) {
                    console.error('[ProjectStore] fetch error:', err);
                    set({ loading: false });
                }
            },

            updateSettings: async (updates) => {
                // Update local state immediately
                set((state) => ({
                    settings: { ...state.settings, ...updates }
                }));

                // Sync to DB
                try {
                    const payload: any = {};
                    if (updates.projectName !== undefined) payload.project_name = updates.projectName;
                    if (updates.projectDescription !== undefined) payload.project_description = updates.projectDescription;
                    if (updates.primaryColor !== undefined) payload.project_color = updates.primaryColor;
                    if (updates.defaultLanguage !== undefined) payload.default_locale = updates.defaultLanguage;
                    if (updates.timezone !== undefined) payload.default_timezone = updates.timezone;
                    if (updates.theme !== undefined) payload.theme = updates.theme;
                    if (updates.fontFamily !== undefined) payload.default_font = updates.fontFamily;
                    if (updates.defaultPageSize !== undefined) payload.default_page_size = updates.defaultPageSize;
                    if (updates.defaultSortField !== undefined) payload.default_sort_field = updates.defaultSortField;
                    if (updates.defaultSortOrder !== undefined) payload.default_sort_order = updates.defaultSortOrder;
                    if (updates.dateFormat !== undefined) payload.date_format = updates.dateFormat;
                    if (updates.numberFormat !== undefined) payload.number_format = updates.numberFormat;
                    if (updates.featureFlags !== undefined) payload.feature_flags = updates.featureFlags;
                    if (updates.logoUrl !== undefined) payload.project_logo = updates.logoUrl;

                    if (Object.keys(payload).length > 0) {
                        await api.patch('/settings', payload);
                    }
                } catch (err) {
                    console.error('[ProjectStore] update error:', err);
                }
            },

            updateFileSettings: (updates) => set((state) => ({
                fileSettings: { ...state.fileSettings, ...updates }
            })),

            updateFeatureFlag: async (flag, value) => {
                const newFlags = { ...get().settings.featureFlags, [flag]: value };
                set((state) => ({
                    settings: { ...state.settings, featureFlags: newFlags }
                }));
                try {
                    await api.patch('/settings', { feature_flags: newFlags });
                } catch (err) {
                    console.error('[ProjectStore] updateFeatureFlag error:', err);
                }
            },
        }),
        { name: 'nexdirect-project' }
    )
);
