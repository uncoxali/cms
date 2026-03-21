import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

function deriveRole(adminAccess: any, permissions: any): Role {
    if (adminAccess === true || adminAccess === 1 || adminAccess === '1') return 'admin';

    // If permissions is the legacy { _all: { ... } } format
    if (permissions && !Array.isArray(permissions) && (permissions as any)._all) {
        const all = (permissions as any)._all;
        if (all.create || all.update || all.delete) return 'editor';
        if (all.read) return 'viewer';
    }

    // Normalize new structured format: { collections: [...] }
    let collectionPerms: any[] = [];
    if (Array.isArray(permissions)) {
        collectionPerms = permissions;
    } else if (permissions && Array.isArray((permissions as any).collections)) {
        collectionPerms = (permissions as any).collections;
    }

    // If permissions is an array of per-collection permissions
    if (collectionPerms.length > 0) {
        const hasWrite = collectionPerms.some((p: any) =>
            (p.create && p.create !== 'none') ||
            (p.update && p.update !== 'none') ||
            (p.delete && p.delete !== 'none')
        );
        if (hasWrite) return 'editor';
        return 'viewer';
    }

    return 'viewer';
}

export function hasCollectionAccess(
    user: { admin_access?: boolean; permissions?: any } | null,
    collection: string,
    action: 'create' | 'read' | 'update' | 'delete' = 'read'
): boolean {
    if (!user) return false;
    if (user.admin_access) return true;

    const perms = user.permissions;
    if (!perms) return false;

    // Legacy _all format
    if (!Array.isArray(perms) && (perms as any)._all) {
        return !!(perms as any)._all[action];
    }

    // New structured format: { collections: [...], _modules, ... }
    const collectionPerms: any[] = Array.isArray(perms)
        ? perms
        : Array.isArray((perms as any).collections)
            ? (perms as any).collections
            : [];

    if (collectionPerms.length === 0) return false;

    const collPerm = collectionPerms.find((p: any) => p.collection === collection || p.collection === '_all');
    if (!collPerm) return false;

    return collPerm[action] && collPerm[action] !== 'none';
}

export type Role = 'admin' | 'editor' | 'viewer' | null;

export interface CollectionPermission {
    collection: string;
    create: string;
    read: string;
    update: string;
    delete: string;
    share?: string;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role_id?: string;
    role_name?: string;
    admin_access?: boolean;
    permissions?: CollectionPermission[] | Record<string, any>;
}

// Token refresh scheduler
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function getTokenRefreshInterval(): number {
    // Get from localStorage (project settings)
    try {
        const stored = localStorage.getItem('nexdirect-project');
        if (stored) {
            const settings = JSON.parse(stored);
            const interval = settings?.state?.settings?.tokenRefreshInterval || 6;
            return interval * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        }
    } catch {}
    return 6 * 24 * 60 * 60 * 1000; // Default: 6 days
}

export function getTokenExpirationDays(): number {
    // Get from localStorage (project settings)
    try {
        const stored = localStorage.getItem('nexdirect-project');
        if (stored) {
            const settings = JSON.parse(stored);
            return settings?.state?.settings?.tokenExpiration || 7;
        }
    } catch {}
    return 7; // Default: 7 days
}

function scheduleTokenRefresh(refreshFn: () => Promise<boolean>) {
    // Clear existing timer
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }
    
    // Get refresh interval from settings
    const REFRESH_INTERVAL = getTokenRefreshInterval();
    
    // Don't schedule if interval is 0 (disabled)
    if (REFRESH_INTERVAL <= 0) {
        console.log('[Auth] Auto-refresh is disabled');
        return;
    }
    
    console.log(`[Auth] Token refresh scheduled every ${REFRESH_INTERVAL / (24 * 60 * 60 * 1000)} days`);
    
    refreshTimer = setTimeout(async () => {
        console.log('[Auth] Auto-refreshing token...');
        const success = await refreshFn();
        if (success) {
            // Schedule next refresh
            scheduleTokenRefresh(refreshFn);
        }
    }, REFRESH_INTERVAL);
}

function clearTokenRefresh() {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

interface AuthState {
    user: UserData | null;
    role: Role;
    token: string | null;
    loading: boolean;
    error: string | null;
    _hasHydrated: boolean;
    loginWithApi: (email: string, password: string) => Promise<boolean>;
    restoreSession: () => Promise<boolean>;
    refreshToken: () => Promise<boolean>;
    login: (role: Role) => void;
    logout: () => void;
    setError: (error: string | null) => void;
    setHasHydrated: (v: boolean) => void;
    updateUserAvatar: (avatar: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            role: null,
            token: null,
            loading: false,
            error: null,
            _hasHydrated: false,

            setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

            loginWithApi: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const res = await api.post('/auth/login', { email, password });

                    api.setToken(res.access_token);
                    localStorage.setItem('nexdirect-token', res.access_token);

                    const role = deriveRole(res.user.admin_access, res.user.permissions);

                    set({
                        user: {
                            id: res.user.id,
                            name: `${res.user.first_name} ${res.user.last_name}`,
                            email: res.user.email,
                            avatar: res.user.avatar || undefined,
                            role_id: res.user.role,
                            role_name: res.user.role_name,
                            admin_access: !!res.user.admin_access,
                            permissions: res.user.permissions || [],
                        },
                        role,
                        token: res.access_token,
                        loading: false,
                        error: null,
                    });

                    // Schedule token refresh
                    scheduleTokenRefresh(get().refreshToken);

                    return true;
                } catch (err: any) {
                    set({ loading: false, error: err.message || 'Login failed' });
                    return false;
                }
            },

            restoreSession: async () => {
                const { token } = get();
                if (!token) return false;

                api.setToken(token);
                try {
                    const res = await api.get('/auth/me');
                    const u = res.user;

                    const role = deriveRole(u.admin_access, u.permissions);

                    set({
                        user: {
                            id: u.id,
                            name: `${u.first_name} ${u.last_name}`,
                            email: u.email,
                            avatar: u.avatar || undefined,
                            role_id: u.role_id,
                            role_name: u.role_name,
                            admin_access: !!u.admin_access,
                            permissions: u.permissions || [],
                        },
                        role,
                        token,
                    });
                    
                    // Schedule token refresh
                    scheduleTokenRefresh(get().refreshToken);
                    
                    return true;
                } catch {
                    set({ user: null, role: null, token: null });
                    localStorage.removeItem('nexdirect-token');
                    return false;
                }
            },

            refreshToken: async () => {
                const { token } = get();
                if (!token) return false;

                try {
                    const res = await api.post('/auth/refresh');
                    
                    if (res.access_token) {
                        api.setToken(res.access_token);
                        localStorage.setItem('nexdirect-token', res.access_token);
                        
                        const u = res.user;
                        const role = deriveRole(u.admin_access, u.permissions);

                        set({
                            user: {
                                id: u.id,
                                name: `${u.first_name} ${u.last_name}`,
                                email: u.email,
                                avatar: u.avatar || undefined,
                                role_id: u.role,
                                role_name: u.role_name,
                                admin_access: !!u.admin_access,
                                permissions: u.permissions || [],
                            },
                            role,
                            token: res.access_token,
                        });
                        return true;
                    }
                    return false;
                } catch (err) {
                    console.error('[Auth] Token refresh failed:', err);
                    return false;
                }
            },

            login: (role) =>
                set({
                    user: {
                        id: '1',
                        name: role === 'admin' ? 'Admin User' : role === 'editor' ? 'Editor User' : 'Viewer User',
                        email: `${role}@example.com`,
                    },
                    role,
                }),

            logout: async () => {
                // Clear token refresh timer
                clearTokenRefresh();
                
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                } catch { /* ignore */ }
                api.setToken(null);
                localStorage.removeItem('nexdirect-token');
                localStorage.removeItem('nexdirect-schema');
                localStorage.removeItem('neurofy-activity-storage');
                localStorage.removeItem('nexdirect-files');
                localStorage.removeItem('nexdirect-flows');
                localStorage.removeItem('nexdirect-bookmarks');
                localStorage.removeItem('nexdirect-revisions');
                set({ user: null, role: null, token: null, error: null });
            },

            setError: (error) => set({ error }),
            updateUserAvatar: (avatar: string | null) =>
                set((state) => state.user ? { user: { ...state.user, avatar: avatar || undefined } } : state),
        }),
        {
            name: 'neurofy-auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            partialize: (state) => ({
                user: state.user,
                role: state.role,
                token: state.token,
            }),
        }
    )
);
