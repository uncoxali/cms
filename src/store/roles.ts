import { create } from 'zustand';
import { api } from '@/lib/api';

export type PermissionAccess = 'full' | 'filter' | 'none';

export interface PermissionRule {
    collection: string;
    create: PermissionAccess;
    read: PermissionAccess;
    update: PermissionAccess;
    delete: PermissionAccess;
    share: PermissionAccess;
    createFilter?: string;
    readFilter?: string;
    updateFilter?: string;
    deleteFilter?: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    appAccess: boolean;
    adminAccess: boolean;
    userCount: number;
    permissions: PermissionRule[];
    rawPermissions?: any;
}

interface RolesState {
    roles: Role[];
    loading: boolean;
    fetchRoles: () => Promise<void>;
    addRole: (role: Omit<Role, 'id' | 'userCount'>) => Promise<void>;
    updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    updatePermission: (roleId: string, collection: string, updates: Partial<PermissionRule>) => Promise<void>;
}

function mapDbRole(r: any): Role {
    // Parse permissions: DB stores as array or structured object, normalize to PermissionRule[]
    const raw = r.permissions;
    let permissions: PermissionRule[] = [];

    try {
        if (Array.isArray(raw)) {
            permissions = raw;
        } else if (raw && typeof raw === 'object') {
            // New structured format: { collections: PermissionRule[], _modules, _api, _pages }
            if (Array.isArray((raw as any).collections)) {
                permissions = (raw as any).collections;
            } else if (raw.collections && typeof raw.collections === 'object') {
                // Object format: { collections: { ... } }
                permissions = [];
            } else {
                // Legacy format: { collectionName: { create, read, update, delete } }
                permissions = Object.entries(raw)
                    .filter(([k]) => k !== '_all' && k !== '_modules' && k !== '_api' && k !== '_pages')
                    .map(([collection, perms]: [string, any]) => ({
                        collection,
                        create: perms.create ? 'full' : 'none' as PermissionAccess,
                        read: perms.read ? 'full' : 'none' as PermissionAccess,
                        update: perms.update ? 'full' : 'none' as PermissionAccess,
                        delete: perms.delete ? 'full' : 'none' as PermissionAccess,
                        share: 'none' as PermissionAccess,
                    }));
            }
        }
    } catch (e) {
        console.warn('[RolesStore] Error parsing permissions:', e);
        permissions = [];
    }

    return {
        id: r.id,
        name: r.name,
        description: r.description || '',
        appAccess: !!r.app_access,
        adminAccess: !!r.admin_access,
        userCount: r.user_count || 0,
        permissions,
        rawPermissions: raw,
    };
}

export const useRolesStore = create<RolesState>()((set, get) => ({
    roles: [],
    loading: false,

    fetchRoles: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
            const token = api.getToken();
            if (!token) { set({ loading: false }); return; }
            const res = await api.get('/roles') as any;
            const rawData = res?.data || res || [];
            const data = Array.isArray(rawData) ? rawData : (rawData.data || []);
            const roles = data.map(mapDbRole);
            set({ roles, loading: false });
        } catch (err) {
            console.error('[RolesStore] fetch error:', err);
            set({ loading: false });
        }
    },

    addRole: async (roleData) => {
        try {
            await api.post('/roles', {
                name: roleData.name,
                description: roleData.description,
                admin_access: roleData.adminAccess,
                app_access: roleData.appAccess,
                permissions: roleData.permissions || [],
            });
            await get().fetchRoles();
        } catch (err) {
            console.error('[RolesStore] add error:', err);
            throw err;
        }
    },

    updateRole: async (id, updates) => {
        try {
            const payload: any = {};
            if (updates.name !== undefined) payload.name = updates.name;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.adminAccess !== undefined) payload.admin_access = updates.adminAccess;
            if (updates.appAccess !== undefined) payload.app_access = updates.appAccess;
            if (updates.permissions !== undefined) payload.permissions = updates.permissions;
            await api.patch(`/roles/${id}`, payload);
            await get().fetchRoles();
        } catch (err) {
            console.error('[RolesStore] update error:', err);
        }
    },

    deleteRole: async (id) => {
        try {
            await api.del(`/roles/${id}`);
            set((state) => ({ roles: state.roles.filter(r => r.id !== id) }));
        } catch (err) {
            console.error('[RolesStore] delete error:', err);
            throw err;
        }
    },

    updatePermission: async (roleId, collection, updates) => {
        const role = get().roles.find(r => r.id === roleId);
        if (!role) return;

        const existingIdx = role.permissions.findIndex(p => p.collection === collection);
        let newPermissions: PermissionRule[];
        if (existingIdx >= 0) {
            newPermissions = [...role.permissions];
            newPermissions[existingIdx] = { ...newPermissions[existingIdx], ...updates };
        } else {
            newPermissions = [
                ...role.permissions,
                { collection, create: 'none', read: 'none', update: 'none', delete: 'none', share: 'none', ...updates }
            ];
        }

        await get().updateRole(roleId, { permissions: newPermissions });
    },
}));
