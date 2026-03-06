import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface FileItem {
    id: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other';
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    folder: string;
    uploadedBy: string;
    uploadedOn: string;
    modifiedOn: string;
    description?: string;
    tags: string[];
    isFavorite: boolean;
    url?: string;
}

export interface Folder {
    id: string;
    name: string;
    parent: string | null;
}

interface FilesState {
    files: FileItem[];
    folders: Folder[];
    loading: boolean;
    fetchFiles: (params?: { type?: string; folder?: string; search?: string; favorites?: boolean }) => Promise<void>;
    addFile: (file: FileItem) => void;
    uploadFile: (formData: FormData) => Promise<void>;
    deleteFile: (id: string) => void;
    deleteFileApi: (id: string) => Promise<void>;
    updateFile: (id: string, updates: Partial<FileItem>) => void;
    toggleFavorite: (id: string) => void;
    toggleFavoriteApi: (id: string) => Promise<void>;
    addFolder: (folder: Folder) => void;
    deleteFolder: (id: string) => void;
}

export const useFilesStore = create<FilesState>()(
    persist(
        (set, get) => ({
            folders: [],
            files: [],
            loading: false,

            fetchFiles: async (params) => {
                set({ loading: true });
                try {
                    const token = api.getToken();
                    if (!token) { set({ loading: false }); return; }

                    const queryParams: Record<string, string> = {};
                    if (params?.type && params.type !== 'all') queryParams.type = params.type;
                    if (params?.folder) queryParams.folder = params.folder;
                    if (params?.search) queryParams.search = params.search;
                    if (params?.favorites) queryParams.favorites = 'true';

                    const res = await api.get<{ data: any[]; folders: any[] }>('/files', queryParams);
                    const files: FileItem[] = (res.data || []).map((f: any) => ({
                        id: f.id,
                        name: f.filename_download || f.title || 'Untitled',
                        type: f.type || 'other',
                        mimeType: f.mime_type || 'application/octet-stream',
                        size: f.filesize || 0,
                        width: f.width || undefined,
                        height: f.height || undefined,
                        folder: f.folder || 'root',
                        uploadedBy: f.uploaded_by || 'Unknown',
                        uploadedOn: f.uploaded_on,
                        modifiedOn: f.modified_on || f.uploaded_on,
                        description: f.description || undefined,
                        tags: f.tags || [],
                        isFavorite: !!f.is_favorite,
                        url: f.filename_disk ? `/uploads/${f.filename_disk}` : undefined,
                    }));
                    const folders: Folder[] = (res.folders || []).map((f: any) => ({
                        id: f.id,
                        name: f.name,
                        parent: f.parent,
                    }));
                    set({ files, folders, loading: false });
                } catch (err) {
                    console.error('[FilesStore] fetch error:', err);
                    set({ loading: false });
                }
            },

            uploadFile: async (formData: FormData) => {
                try {
                    await api.upload('/files', formData);
                    await get().fetchFiles();
                } catch (err) {
                    console.error('[FilesStore] upload error:', err);
                }
            },

            deleteFileApi: async (id: string) => {
                try {
                    await api.del(`/files/${id}`);
                    set((s) => ({ files: s.files.filter(f => f.id !== id) }));
                } catch (err) {
                    console.error('[FilesStore] delete error:', err);
                }
            },

            toggleFavoriteApi: async (id: string) => {
                const file = get().files.find(f => f.id === id);
                if (!file) return;
                try {
                    await api.patch(`/files/${id}`, { is_favorite: !file.isFavorite });
                    set((s) => ({ files: s.files.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f) }));
                } catch (err) {
                    console.error('[FilesStore] toggle favorite error:', err);
                }
            },

            // Local fallback methods
            addFile: (file) => set((s) => ({ files: [file, ...s.files] })),
            deleteFile: (id) => set((s) => ({ files: s.files.filter(f => f.id !== id) })),
            updateFile: (id, updates) => set((s) => ({ files: s.files.map(f => f.id === id ? { ...f, ...updates } : f) })),
            toggleFavorite: (id) => set((s) => ({ files: s.files.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f) })),
            addFolder: (folder) => set((s) => ({ folders: [...s.folders, folder] })),
            deleteFolder: (id) => set((s) => ({ folders: s.folders.filter(f => f.id !== id) })),
        }),
        { name: 'nexdirect-files' }
    )
);
