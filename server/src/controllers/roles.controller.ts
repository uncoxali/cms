import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getRoles(req: AuthenticatedRequest, res: Response) {
    try {
        const roles = await db('neurofy_roles').select('*');

        // Get user counts per role
        const userCounts = await db('neurofy_users')
            .select('role')
            .count('* as count')
            .groupBy('role');
        const countMap: Record<string, number> = {};
        for (const row of userCounts) {
            countMap[(row as any).role] = Number((row as any).count);
        }

        const data = roles.map((r: any) => ({
            ...r,
            user_count: countMap[r.id] || 0,
            permissions: r.permissions_json ? JSON.parse(r.permissions_json) : {},
            permissions_json: undefined,
        }));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getRole(req: AuthenticatedRequest, res: Response) {
    try {
        const role = await db('neurofy_roles').where('id', req.params.id).first();
        if (!role) return res.status(404).json({ error: 'Role not found' });

        res.json({
            data: {
                ...role,
                permissions: role.permissions_json ? JSON.parse(role.permissions_json) : {},
                permissions_json: undefined,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createRole(req: AuthenticatedRequest, res: Response) {
    try {
        const { name, description, admin_access, app_access, icon, permissions } = req.body;
        if (!name) return res.status(400).json({ error: 'Role name is required' });

        const id = `role_${Date.now().toString(36)}`;

        const rawPerms = permissions || [];
        const permissionsPayload = Array.isArray(rawPerms)
            ? { collections: rawPerms, _modules: {}, _api: {}, _pages: {} }
            : {
                collections: Array.isArray(rawPerms.collections) ? rawPerms.collections : [],
                _modules: rawPerms._modules || {},
                _api: rawPerms._api || {},
                _pages: rawPerms._pages || {},
            };

        await db('neurofy_roles').insert({
            id,
            name,
            description: description || null,
            admin_access: admin_access || false,
            app_access: app_access !== false,
            icon: icon || 'supervised_user_circle',
            permissions_json: JSON.stringify(permissionsPayload),
        });

        const newRole = await db('neurofy_roles').where('id', id).first();

        await db('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify({ name }),
        });

        res.json({
            data: {
                id: newRole.id,
                name: newRole.name,
                description: newRole.description,
                app_access: newRole.app_access,
                admin_access: newRole.admin_access,
                icon: newRole.icon,
                user_count: 0,
                permissions: JSON.parse(newRole.permissions_json || '{}'),
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateRole(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;

        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.admin_access !== undefined) updateData.admin_access = body.admin_access;
        if (body.app_access !== undefined) updateData.app_access = body.app_access;
        if (body.icon !== undefined) updateData.icon = body.icon;
        if (body.permissions !== undefined) {
            let perms = body.permissions;
            if (Array.isArray(perms)) {
                perms = { collections: perms, _modules: {}, _api: {}, _pages: {} };
            }
            updateData.permissions_json = JSON.stringify(perms);
        }

        await db('neurofy_roles').where('id', id).update(updateData);

        await db('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify(body),
        });

        const role = await db('neurofy_roles').where('id', id).first();
        res.json({
            data: {
                ...role,
                permissions: JSON.parse(role.permissions_json || '{}'),
                permissions_json: undefined,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteRole(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        // Check if any users have this role
        const users = await db('neurofy_users').where('role', id).count('* as count').first();
        const userCount = (users as any)?.count || 0;
        if (userCount > 0) {
            return res.status(400).json({
                error: `Cannot delete this role because ${userCount} user${userCount > 1 ? 's are' : ' is'} assigned to it.`
            });
        }

        const role = await db('neurofy_roles').where('id', id).first();
        if (!role) return res.status(404).json({ error: 'Role not found' });

        const hasTrashTable = await db.schema.hasTable('neurofy_trash');
        if (!hasTrashTable) {
            await db.schema.createTable('neurofy_trash', (table: any) => {
                table.increments('trash_id').primary();
                table.string('item_id').notNullable();
                table.string('collection').notNullable();
                table.text('data_json').notNullable();
                table.string('deleted_by');
                table.timestamp('deleted_at').defaultTo(db.fn.now());
                table.timestamp('expires_at');
            });
            await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await db('neurofy_trash').insert({
            item_id: id,
            collection: 'neurofy_roles',
            data_json: JSON.stringify({
                ...role,
                _collection_label: 'Roles',
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
        });

        await db('neurofy_roles').where('id', id).delete();

        await db('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify({ _action: 'moved_to_trash' }),
        });

        res.json({ success: true, movedToTrash: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getRolePermissions(req: AuthenticatedRequest, res: Response) {
    try {
        const role = await db('neurofy_roles').where('id', req.params.id).first();
        if (!role) return res.status(404).json({ error: 'Role not found' });

        const permissions = role.permissions_json ? JSON.parse(role.permissions_json) : {};
        res.json({ data: permissions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateRolePermissions(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const permissions = req.body;

        let perms = permissions;
        if (Array.isArray(perms)) {
            perms = { collections: perms, _modules: {}, _api: {}, _pages: {} };
        }

        await db('neurofy_roles').where('id', id).update({
            permissions_json: JSON.stringify(perms)
        });

        await db('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify({ type: 'permissions_update' }),
        });

        res.json({ data: perms });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
