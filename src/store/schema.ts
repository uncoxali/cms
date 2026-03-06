import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collections as initialCollections, CollectionConfig, FieldConfig } from '@/lib/meta/collections';
import { api } from '@/lib/api';

interface SchemaState {
    collections: Record<string, CollectionConfig>;
    loading: boolean;
    loaded: boolean;

    // API actions
    fetchSchema: () => Promise<void>;
    createCollection: (key: string, config: CollectionConfig & { fields?: any[] }) => Promise<void>;
    dropCollection: (key: string, skipFetch?: boolean) => Promise<void>;
    bulkDropCollections: (keys: string[]) => Promise<void>;

    // API-backed field operations
    addFieldApi: (collectionKey: string, field: FieldConfig & { relation?: any }) => Promise<void>;
    deleteFieldApi: (collectionKey: string, fieldName: string) => Promise<void>;

    // Local actions
    addCollection: (key: string, config: CollectionConfig) => void;
    updateCollection: (key: string, updates: Partial<CollectionConfig>) => void;
    deleteCollection: (key: string) => void;
    addField: (collectionKey: string, field: FieldConfig) => void;
    updateField: (collectionKey: string, fieldName: string, updates: Partial<FieldConfig>) => void;
    deleteField: (collectionKey: string, fieldName: string) => void;
}

export const useSchemaStore = create<SchemaState>()(
    persist(
        (set, get) => ({
            collections: initialCollections,
            loading: false,
            loaded: false,

            fetchSchema: async () => {
                if (get().loading) return;
                set({ loading: true });
                try {
                    const token = api.getToken();
                    if (!token) {
                        set({ loading: false });
                        return;
                    }
                    const res = await api.get<{ collections: Record<string, any> }>('/schema');
                    // Convert API schema to CollectionConfig format
                    const collections: Record<string, CollectionConfig> = {};
                    for (const [key, col] of Object.entries(res.collections)) {
                        // Skip system tables in the content view
                        if (col.is_system) continue;
                        collections[key] = {
                            id: key,
                            name: key,
                            label: col.label || key,
                            icon: col.icon || 'database',
                            fields: (col.fields || []).map((f: any) => {
                                const isRelation = !!f.relation;
                                return {
                                    name: f.name,
                                    type: isRelation ? 'relation' : mapSqliteType(f.type),
                                    label: f.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                                    required: !f.nullable,
                                    hidden: false,
                                    interface: isRelation ? 'relation' : mapSqliteTypeToInterface(f.type),
                                    ...(isRelation ? {
                                        relationInfo: {
                                            collection: f.relation.related_collection,
                                            type: 'many-to-one' as const,
                                            displayField: f.relation.display_field || 'id',
                                        },
                                    } : {}),
                                };
                            }),
                        };
                    }

                    // Merge with local collections if API returns none
                    if (Object.keys(collections).length === 0) {
                        set({ loading: false, loaded: true });
                        return;
                    }

                    set({ collections, loading: false, loaded: true });
                } catch (err) {
                    console.error('[SchemaStore] fetch error:', err);
                    set({ loading: false });
                }
            },

            createCollection: async (key, config) => {
                await api.post(`/schema/${key}`, {
                    label: config.label,
                    icon: config.icon,
                    fields: config.fields?.map((f: any) => ({
                        name: f.name,
                        type: f.type || 'string',
                        nullable: !f.required,
                    })),
                });
                await get().fetchSchema();
            },

            dropCollection: async (key, skipFetch = false) => {
                await api.del(`/schema/${key}`);
                set((state) => {
                    const newCols = { ...state.collections };
                    delete newCols[key];
                    return { collections: newCols };
                });
                if (!skipFetch) await get().fetchSchema();
            },

            bulkDropCollections: async (keys) => {
                set({ loading: true });
                try {
                    // Update local state first for immediate UI response
                    set((state) => {
                        const newCols = { ...state.collections };
                        keys.forEach(key => delete newCols[key]);
                        return { collections: newCols };
                    });

                    // Perform all deletions
                    for (const key of keys) {
                        await api.del(`/schema/${key}`);
                    }

                    // Fetch schema once at the end
                    await get().fetchSchema();
                } finally {
                    set({ loading: false });
                }
            },

            addFieldApi: async (collectionKey, field) => {
                const payload: any = {
                    name: field.name,
                    type: field.type || 'string',
                    nullable: !field.required,
                };
                if (field.type === 'relation' && (field as any).relation) {
                    payload.relation = (field as any).relation;
                }
                await api.patch(`/schema/${collectionKey}`, {
                    action: 'add_field',
                    field: payload,
                });
                await get().fetchSchema();
            },

            deleteFieldApi: async (collectionKey, fieldName) => {
                await api.patch(`/schema/${collectionKey}`, {
                    action: 'drop_field',
                    field_name: fieldName,
                });
                await get().fetchSchema();
            },

            addCollection: (key, config) => set((state) => ({
                collections: { ...state.collections, [key]: config }
            })),

            updateCollection: (key, updates) => set((state) => {
                const existing = state.collections[key];
                if (!existing) return state;
                return { collections: { ...state.collections, [key]: { ...existing, ...updates } } };
            }),

            deleteCollection: (key) => set((state) => {
                const newCols = { ...state.collections };
                delete newCols[key];
                return { collections: newCols };
            }),

            addField: (collectionKey, field) => set((state) => {
                const col = state.collections[collectionKey];
                if (!col) return state;
                return { collections: { ...state.collections, [collectionKey]: { ...col, fields: [...col.fields, field] } } };
            }),

            updateField: (collectionKey, fieldName, updates) => set((state) => {
                const col = state.collections[collectionKey];
                if (!col) return state;
                return { collections: { ...state.collections, [collectionKey]: { ...col, fields: col.fields.map(f => f.name === fieldName ? { ...f, ...updates } : f) } } };
            }),

            deleteField: (collectionKey, fieldName) => set((state) => {
                const col = state.collections[collectionKey];
                if (!col) return state;
                return { collections: { ...state.collections, [collectionKey]: { ...col, fields: col.fields.filter(f => f.name !== fieldName) } } };
            }),
        }),
        { name: 'nexdirect-schema' }
    )
);

function mapSqliteType(sqliteType: string): string {
    const t = (sqliteType || '').toUpperCase();
    if (t.includes('INT')) return 'integer';
    if (t.includes('REAL') || t.includes('FLOAT') || t.includes('DOUBLE')) return 'float';
    if (t.includes('BOOL')) return 'boolean';
    if (t.includes('DATE') || t.includes('TIME')) return 'datetime';
    if (t.includes('TEXT') || t.includes('CLOB')) return 'text';
    return 'string';
}

function mapSqliteTypeToInterface(sqliteType: string): string {
    const t = (sqliteType || '').toUpperCase();
    if (t.includes('INT')) return 'input';
    if (t.includes('BOOL')) return 'toggle';
    if (t.includes('DATE') || t.includes('TIME')) return 'datetime';
    if (t.includes('TEXT') || t.includes('CLOB')) return 'input-multiline';
    return 'input';
}
