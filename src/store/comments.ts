import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface FieldComment {
  id: string;
  collection: string;
  itemId: string | number;
  fieldName: string;
  userId: string | number;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface CommentsState {
  comments: FieldComment[];
  loading: boolean;
  
  fetchComments: (collection: string, itemId: string | number) => Promise<void>;
  addComment: (comment: Omit<FieldComment, 'id' | 'timestamp'>) => Promise<void>;
  resolveComment: (commentId: string, resolved: boolean) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  getCommentsForField: (collection: string, itemId: string | number, fieldName: string) => FieldComment[];
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  loading: false,

  fetchComments: async (collection, itemId) => {
    set({ loading: true });
    try {
      const res = await api.get<{ data: FieldComment[] }>(`/comments`, {
        collection,
        itemId: String(itemId),
      });
      set({ comments: res.data || [], loading: false });
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      set({ loading: false });
    }
  },

  addComment: async (comment) => {
    try {
      const res = await api.post<{ data: FieldComment }>(`/comments`, comment);
      set((state) => ({
        comments: [...state.comments, res.data],
      }));
    } catch (err) {
      console.error('Failed to add comment:', err);
      throw err;
    }
  },

  resolveComment: async (commentId, resolved) => {
    try {
      await api.patch(`/comments/${commentId}`, { resolved });
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId
            ? { ...c, resolved, resolvedAt: resolved ? new Date().toISOString() : undefined }
            : c
        ),
      }));
    } catch (err) {
      console.error('Failed to resolve comment:', err);
      throw err;
    }
  },

  deleteComment: async (commentId) => {
    try {
      await api.del(`/comments/${commentId}`);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  },

  getCommentsForField: (collection, itemId, fieldName) => {
    return get().comments.filter(
      (c) => c.collection === collection && c.itemId === itemId && c.fieldName === fieldName
    );
  },
}));
