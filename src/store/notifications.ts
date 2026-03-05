import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    collection?: string;
    item?: string | number;
    timestamp: string;
    isRead: boolean;
}

interface NotificationsState {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set) => ({
            notifications: [
                {
                    id: 'not_1',
                    title: 'Welcome to CMS',
                    message: 'Your Directus clone is up and running.',
                    timestamp: new Date().toISOString(),
                    isRead: false
                }
            ],
            addNotification: (input) => set((state) => ({
                notifications: [
                    {
                        ...input,
                        id: `not_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        timestamp: new Date().toISOString(),
                        isRead: false
                    },
                    ...state.notifications
                ]
            })),
            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                )
            })),
            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            })),
            clearAll: () => set({ notifications: [] })
        }),
        {
            name: 'directus-notifications-storage',
        }
    )
);
