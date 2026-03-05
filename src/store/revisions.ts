import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Revision {
    id: string; // unique ID for this revision
    collection: string; // The collection name (e.g., 'products')
    itemId: any; // The ID of the item being revised
    dataSnapshot: Record<string, any>; // The complete data snapshot
    createdBy: string; // User ID or name
    createdAt: string; // ISO date string
}

interface RevisionsState {
    revisions: Revision[];
    addRevision: (revision: Omit<Revision, 'id' | 'createdAt'>) => void;
    getRevisionsForItem: (collection: string, itemId: any) => Revision[];
}

export const useRevisionsStore = create<RevisionsState>()(
    persist(
        (set, get) => ({
            revisions: [],
            addRevision: (revData) => {
                const newRevision: Revision = {
                    ...revData,
                    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    createdAt: new Date().toISOString()
                };
                set((state) => ({
                    revisions: [newRevision, ...state.revisions]
                }));
            },
            getRevisionsForItem: (collection, itemId) => {
                // Find all revisions for standardizing history views. Latest first.
                return get().revisions.filter(r => r.collection === collection && String(r.itemId) === String(itemId))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
        }),
        {
            name: 'nexdirect-revisions'
        }
    )
);
