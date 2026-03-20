import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> };

interface FieldPermission {
  read: 'none' | 'partial' | 'full';
  write: 'none' | 'partial' | 'full';
}

interface ItemFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
  conjunction: 'and' | 'or';
}

interface CollectionPermissions {
  fields: Record<string, FieldPermission>;
  itemFilter: ItemFilter[];
}

interface RolePermissions {
  roleId: string;
  collections: Record<string, CollectionPermissions>;
}

interface ValidationRule {
  id: string;
  collection: string;
  field: string;
  rule: Record<string, unknown>;
  errorMessage: string;
}

const OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'in', label: 'In list' },
  { value: 'null', label: 'Is null' },
  { value: 'nnull', label: 'Is not null' },
];

function validateOperator(operator: string): boolean {
  return OPERATORS.some(op => op.value === operator);
}

function validateFilter(filter: ItemFilter): boolean {
  if (!filter.field || !filter.operator) return false;
  if (!validateOperator(filter.operator)) return false;
  if (filter.conjunction && !['and', 'or'].includes(filter.conjunction)) return false;
  return true;
}

// GET /api/roles/[id]/permissions
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = getAuthFromRequest(request);
  if (!auth?.adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const role = await db('neurofy_roles').where('id', id).first();
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const permissions = JSON.parse(role.permissions_json || '{}');
    const fieldPermissions = permissions.fieldPermissions || {};
    const itemFilters = permissions.itemFilters || {};
    const validationRules = permissions.validationRules || [];

    const response: RolePermissions & { validationRules: ValidationRule[] } = {
      roleId: id,
      collections: {},
      validationRules,
    };

    Object.keys(fieldPermissions).forEach(collection => {
      response.collections[collection] = {
        fields: fieldPermissions[collection] || {},
        itemFilter: itemFilters[collection] || [],
      };
    });

    Object.keys(itemFilters).forEach(collection => {
      if (!response.collections[collection]) {
        response.collections[collection] = {
          fields: {},
          itemFilter: itemFilters[collection] || [],
        };
      }
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// PATCH /api/roles/[id]/permissions
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = getAuthFromRequest(request);
  if (!auth?.adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const body = await request.json();

  try {
    const role = await db('neurofy_roles').where('id', id).first();
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const currentPermissions = JSON.parse(role.permissions_json || '{}');
    const fieldPermissions = currentPermissions.fieldPermissions || {};
    const itemFilters = currentPermissions.itemFilters || {};
    const validationRules = currentPermissions.validationRules || [];

    if (body.collection && body.field && body.type) {
      if (!fieldPermissions[body.collection]) {
        fieldPermissions[body.collection] = {};
      }
      if (!fieldPermissions[body.collection][body.field]) {
        fieldPermissions[body.collection][body.field] = { read: 'full', write: 'full' };
      }
      fieldPermissions[body.collection][body.field][body.type] = body.value;

      if (
        fieldPermissions[body.collection][body.field].read === 'full' &&
        fieldPermissions[body.collection][body.field].write === 'full'
      ) {
        delete fieldPermissions[body.collection][body.field];
      }
      if (Object.keys(fieldPermissions[body.collection]).length === 0) {
        delete fieldPermissions[body.collection];
      }
    }

    if (body.collection && body.itemFilter !== undefined) {
      if (!Array.isArray(body.itemFilter)) {
        return NextResponse.json({ error: 'itemFilter must be an array' }, { status: 400 });
      }

      for (const filter of body.itemFilter) {
        if (!validateFilter(filter)) {
          return NextResponse.json({ error: 'Invalid filter structure' }, { status: 400 });
        }
      }

      itemFilters[body.collection] = body.itemFilter;
      if (body.itemFilter.length === 0) {
        delete itemFilters[body.collection];
      }
    }

    if (body.validationRule) {
      const existingIndex = validationRules.findIndex(
        (r: ValidationRule) => r.id === body.validationRule.id
      );
      if (existingIndex >= 0) {
        validationRules[existingIndex] = body.validationRule;
      } else {
        validationRules.push(body.validationRule);
      }
    }

    if (body.deleteValidationRule) {
      const ruleIndex = validationRules.findIndex(
        (r: ValidationRule) => r.id === body.deleteValidationRule
      );
      if (ruleIndex >= 0) {
        validationRules.splice(ruleIndex, 1);
      }
    }

    const newPermissions = {
      ...currentPermissions,
      fieldPermissions,
      itemFilters,
      validationRules,
    };

    await db('neurofy_roles')
      .where('id', id)
      .update({ permissions_json: JSON.stringify(newPermissions) });

    await db('neurofy_activity').insert({
      action: 'update',
      user: auth.email,
      user_id: auth.userId,
      collection: 'neurofy_roles',
      item: id,
      meta_json: JSON.stringify({
        type: 'permissions_update',
        changes: body,
      }),
    });

    return NextResponse.json({
      data: {
        roleId: id,
        collections: Object.fromEntries(
          Object.entries(fieldPermissions).map(([k, v]) => [
            k,
            { fields: v, itemFilter: itemFilters[k] || [] },
          ])
        ),
        validationRules,
      },
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
