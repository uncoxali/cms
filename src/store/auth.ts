import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export type Role = 'admin' | 'editor' | 'viewer' | null;

interface UserData {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role_id?: string;
    role_name?: string;
    admin_access?: boolean;
}

interface AuthState {
    user: UserData | null;
    role: Role;
    token: string | null;
    loading: boolean;
    error: string | null;
    loginWithApi: (email: string, password: string) => Promise<boolean>;
    login: (role: Role) => void; // Legacy fallback
    logout: () => void;
    setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            role: null,
            token: null,
            loading: false,
            error: null,

            loginWithApi: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const res = await api.post('/auth/login', { email, password });

                    // Store token
                    api.setToken(res.access_token);
                    localStorage.setItem('nexdirect-token', res.access_token);

                    // Determine role type
                    const roleMap: Record<string, Role> = {
                        role_admin: 'admin',
                        role_editor: 'editor',
                        role_viewer: 'viewer',
                    };

                    const role = roleMap[res.user.role] || 'viewer';

                    set({
                        user: {
                            id: res.user.id,
                            name: `${res.user.first_name} ${res.user.last_name}`,
                            email: res.user.email,
                            avatar: res.user.avatar || undefined,
                            role_id: res.user.role,
                            role_name: res.user.role_name,
                            admin_access: res.user.admin_access,
                        },
                        role,
                        token: res.access_token,
                        loading: false,
                        error: null,
                    });

                    return true;
                } catch (err: any) {
                    set({ loading: false, error: err.message || 'Login failed' });
                    return false;
                }
            },

            // Legacy login for demo mode
            login: (role) =>
                set({
                    user: {
                        id: '1',
                        name: role === 'admin' ? 'Admin User' : role === 'editor' ? 'Editor User' : 'Viewer User',
                        email: `${role}@example.com`,
                    },
                    role,
                }),

            logout: () => {
                api.setToken(null);
                localStorage.removeItem('nexdirect-token');
                // Clear all persisted store data so next login gets fresh data
                localStorage.removeItem('nexdirect-schema');
                localStorage.removeItem('directus-activity-storage');
                localStorage.removeItem('nexdirect-files');
                localStorage.removeItem('nexdirect-flows');
                localStorage.removeItem('nexdirect-bookmarks');
                localStorage.removeItem('nexdirect-revisions');
                set({ user: null, role: null, token: null, error: null });
            },

            setError: (error) => set({ error }),
        }),
        {
            name: 'directus-auth-storage',
        }
    )
);
