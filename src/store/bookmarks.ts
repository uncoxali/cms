import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bookmark {
    id: string;
    name: string;
    collection: string;
    filters: any[]; // Complex filter arrays
    sort: string;
    visibleColumns: string[];
    layout: 'table' | 'card';
    pageSize: number;
    scope: 'personal' | 'global';
    createdBy: string;
    dateCreated: string;
}

interface BookmarksState {
    bookmarks: Bookmark[];
    addBookmark: (bookmark: Bookmark) => void;
    updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
    deleteBookmark: (id: string) => void;
}

export const useBookmarksStore = create<BookmarksState>()(
    persist(
        (set) => ({
            bookmarks: [
                {
                    id: 'b1',
                    name: 'Active Products',
                    collection: 'products',
                    filters: [{ field: 'isActive', operator: '_eq', value: true }],
                    sort: '-createdAt',
                    visibleColumns: ['id', 'title', 'price', 'isActive'],
                    layout: 'table',
                    pageSize: 20,
                    scope: 'global',
                    createdBy: 'system',
                    dateCreated: new Date().toISOString(),
                }
            ],
            addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
            updateBookmark: (id, updates) => set((state) => ({
                bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b))
            })),
            deleteBookmark: (id) => set((state) => ({
                bookmarks: state.bookmarks.filter((b) => b.id !== id)
            })),
        }),
        {
            name: 'neurofy-bookmarks-storage',
        }
    )
);
