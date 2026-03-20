'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface FieldPermission {
  read: 'none' | 'partial' | 'full';
  write: 'none' | 'partial' | 'full';
}

export interface ItemFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
  conjunction: 'and' | 'or';
}

export interface CollectionPermissions {
  fields: Record<string, FieldPermission>;
  itemFilter: ItemFilter[];
}

export interface ValidationRule {
  id: string;
  collection: string;
  field: string;
  rule: Record<string, unknown>;
  errorMessage: string;
}

export interface RolePermissions {
  roleId: string;
  collections: Record<string, CollectionPermissions>;
  validationRules: ValidationRule[];
}

interface PermissionsState {
  permissions: Record<string, RolePermissions>;
  validationRules: ValidationRule[];
  isLoading: boolean;
  error: string | null;

  fetchRolePermissions: (roleId: string) => Promise<void>;
  updateFieldPermission: (
    roleId: string,
    collection: string,
    field: string,
    type: 'read' | 'write',
    value: FieldPermission['read'] | FieldPermission['write']
  ) => Promise<void>;
  updateItemFilter: (
    roleId: string,
    collection: string,
    filter: ItemFilter[]
  ) => Promise<void>;
  addValidationRule: (rule: Omit<ValidationRule, 'id'>) => Promise<void>;
  updateValidationRule: (rule: ValidationRule) => Promise<void>;
  deleteValidationRule: (ruleId: string, collection: string) => Promise<void>;
  checkFieldAccess: (
    roleId: string,
    collection: string,
    field: string,
    action: 'read' | 'write'
  ) => boolean;
  checkItemAccess: (
    roleId: string,
    collection: string,
    item: Record<string, unknown>
  ) => boolean;
  resolveFilterVariables: (
    filter: ItemFilter[],
    context: { userId?: string; roleId?: string }
  ) => ItemFilter[];
}

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      permissions: {},
      validationRules: [],
      isLoading: false,
      error: null,

      fetchRolePermissions: async (roleId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<{
            data: RolePermissions;
            validationRules: ValidationRule[];
          }>(`/roles/${roleId}/permissions`);

          set((state) => ({
            permissions: {
              ...state.permissions,
              [roleId]: response.data || {
                roleId,
                collections: {},
                validationRules: [],
              },
            },
            isLoading: false,
          }));
        } catch {
          set((state) => ({
            permissions: {
              ...state.permissions,
              [roleId]: {
                roleId,
                collections: {},
                validationRules: [],
              },
            },
            isLoading: false,
          }));
        }
      },

      updateFieldPermission: async (
        roleId: string,
        collection: string,
        field: string,
        type: 'read' | 'write',
        value: FieldPermission['read'] | FieldPermission['write']
      ) => {
        const currentPermissions = get().permissions[roleId];
        const currentCollection =
          currentPermissions?.collections?.[collection] || {
            fields: {},
            itemFilter: [],
          };

        const updatedField: FieldPermission = {
          read: currentCollection.fields[field]?.read || 'full',
          write: currentCollection.fields[field]?.write || 'full',
          [type]: value,
        };

        const updatedCollection: CollectionPermissions = {
          ...currentCollection,
          fields: {
            ...currentCollection.fields,
            [field]: updatedField,
          },
        };

        set((state) => ({
          permissions: {
            ...state.permissions,
            [roleId]: {
              ...state.permissions[roleId],
              collections: {
                ...state.permissions[roleId]?.collections,
                [collection]: updatedCollection,
              },
            },
          },
        }));

        try {
          await api.patch(`/roles/${roleId}/permissions`, {
            collection,
            field,
            type,
            value,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update permission',
          });
          throw error;
        }
      },

      updateItemFilter: async (roleId: string, collection: string, filter: ItemFilter[]) => {
        set((state) => ({
          permissions: {
            ...state.permissions,
            [roleId]: {
              ...state.permissions[roleId],
              collections: {
                ...state.permissions[roleId]?.collections,
                [collection]: {
                  ...state.permissions[roleId]?.collections?.[collection],
                  itemFilter: filter,
                },
              },
            },
          },
        }));

        try {
          await api.patch(`/roles/${roleId}/permissions`, {
            collection,
            itemFilter: filter,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update item filter',
          });
          throw error;
        }
      },

      addValidationRule: async (rule: Omit<ValidationRule, 'id'>) => {
        const newRule: ValidationRule = {
          ...rule,
          id: `vr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
          validationRules: [...state.validationRules, newRule],
        }));

        try {
          await api.post(`/roles/${rule.collection}/validation-rules`, newRule);
        } catch (error) {
          set((state) => ({
            validationRules: state.validationRules.filter((r) => r.id !== newRule.id),
            error:
              error instanceof Error ? error.message : 'Failed to add validation rule',
          }));
          throw error;
        }
      },

      updateValidationRule: async (rule: ValidationRule) => {
        const previousRules = get().validationRules;
        set((state) => ({
          validationRules: state.validationRules.map((r) =>
            r.id === rule.id ? rule : r
          ),
        }));

        try {
          await api.patch(
            `/roles/${rule.collection}/validation-rules/${rule.id}`,
            rule
          );
        } catch {
          set({ validationRules: previousRules });
          throw new Error('Failed to update validation rule');
        }
      },

      deleteValidationRule: async (ruleId: string, collection: string) => {
        const ruleToDelete = get().validationRules.find((r) => r.id === ruleId);
        set((state) => ({
          validationRules: state.validationRules.filter((r) => r.id !== ruleId),
        }));

        try {
          await api.del(`/roles/${collection}/validation-rules/${ruleId}`);
        } catch {
          set((state) => ({
            validationRules: ruleToDelete
              ? [...state.validationRules, ruleToDelete]
              : state.validationRules,
          }));
          throw new Error('Failed to delete validation rule');
        }
      },

      checkFieldAccess: (
        roleId: string,
        collection: string,
        field: string,
        action: 'read' | 'write'
      ) => {
        const permissions = get().permissions[roleId];
        const fieldPermission = permissions?.collections?.[collection]?.fields?.[field];

        if (!fieldPermission) return true;

        if (action === 'read') {
          return fieldPermission.read !== 'none';
        }

        return fieldPermission.write !== 'none';
      },

      checkItemAccess: (
        roleId: string,
        collection: string,
        item: Record<string, unknown>
      ) => {
        const permissions = get().permissions[roleId];
        const itemFilter = permissions?.collections?.[collection]?.itemFilter;

        if (!itemFilter || itemFilter.length === 0) return true;

        const resolvedFilter = get().resolveFilterVariables(itemFilter, {});

        return resolvedFilter.every((f) => {
          const itemValue = item[f.field];
          const filterValue = f.value;

          switch (f.operator) {
            case 'eq':
              return itemValue === filterValue;
            case 'neq':
              return itemValue !== filterValue;
            case 'contains':
              return String(itemValue).includes(filterValue);
            case 'starts_with':
              return String(itemValue).startsWith(filterValue);
            case 'ends_with':
              return String(itemValue).endsWith(filterValue);
            case 'gt':
              return Number(itemValue) > Number(filterValue);
            case 'gte':
              return Number(itemValue) >= Number(filterValue);
            case 'lt':
              return Number(itemValue) < Number(filterValue);
            case 'lte':
              return Number(itemValue) <= Number(filterValue);
            case 'in':
              return filterValue.split(',').includes(String(itemValue));
            case 'null':
              return itemValue === null;
            case 'nnull':
              return itemValue !== null;
            default:
              return true;
          }
        });
      },

      resolveFilterVariables: (
        filter: ItemFilter[],
        context: { userId?: string; roleId?: string }
      ) => {
        return filter.map((f) => {
          let value = f.value;

          if (typeof value === 'string') {
            value = value
              .replace(/\$CURRENT_USER/g, context.userId || '')
              .replace(/\$CURRENT_ROLE/g, context.roleId || '')
              .replace(/\$NOW/g, new Date().toISOString())
              .replace(
                /\$NOW\((-?\d+)\s*(day|week|month)s?\)/g,
                (_: string, num: string, unit: string) => {
                  const date = new Date();
                  switch (unit) {
                    case 'day':
                      date.setDate(date.getDate() + parseInt(num, 10));
                      break;
                    case 'week':
                      date.setDate(date.getDate() + parseInt(num, 10) * 7);
                      break;
                    case 'month':
                      date.setMonth(date.getMonth() + parseInt(num, 10));
                      break;
                  }
                  return date.toISOString();
                }
              );
          }

          return { ...f, value };
        });
      },
    }),
    {
      name: 'permissions-storage',
      partialize: (state) => ({
        permissions: state.permissions,
        validationRules: state.validationRules,
      }),
    }
  )
);
