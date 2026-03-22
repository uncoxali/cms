"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.getRole = getRole;
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
exports.getRolePermissions = getRolePermissions;
exports.updateRolePermissions = updateRolePermissions;
const database_1 = require("../config/database");
async function getRoles(req, res) {
    try {
        const roles = await (0, database_1.db)('neurofy_roles').select('*');
        // Get user counts per role
        const userCounts = await (0, database_1.db)('neurofy_users')
            .select('role')
            .count('* as count')
            .groupBy('role');
        const countMap = {};
        for (const row of userCounts) {
            countMap[row.role] = Number(row.count);
        }
        const data = roles.map((r) => ({
            ...r,
            user_count: countMap[r.id] || 0,
            permissions: r.permissions_json ? JSON.parse(r.permissions_json) : {},
            permissions_json: undefined,
        }));
        res.json({ data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getRole(req, res) {
    try {
        const role = await (0, database_1.db)('neurofy_roles').where('id', req.params.id).first();
        if (!role)
            return res.status(404).json({ error: 'Role not found' });
        res.json({
            data: {
                ...role,
                permissions: role.permissions_json ? JSON.parse(role.permissions_json) : {},
                permissions_json: undefined,
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function createRole(req, res) {
    try {
        const { name, description, admin_access, app_access, icon, permissions } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Role name is required' });
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
        await (0, database_1.db)('neurofy_roles').insert({
            id,
            name,
            description: description || null,
            admin_access: admin_access || false,
            app_access: app_access !== false,
            icon: icon || 'supervised_user_circle',
            permissions_json: JSON.stringify(permissionsPayload),
        });
        const newRole = await (0, database_1.db)('neurofy_roles').where('id', id).first();
        await (0, database_1.db)('neurofy_activity').insert({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateRole(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;
        const updateData = {};
        if (body.name !== undefined)
            updateData.name = body.name;
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.admin_access !== undefined)
            updateData.admin_access = body.admin_access;
        if (body.app_access !== undefined)
            updateData.app_access = body.app_access;
        if (body.icon !== undefined)
            updateData.icon = body.icon;
        if (body.permissions !== undefined) {
            let perms = body.permissions;
            if (Array.isArray(perms)) {
                perms = { collections: perms, _modules: {}, _api: {}, _pages: {} };
            }
            updateData.permissions_json = JSON.stringify(perms);
        }
        await (0, database_1.db)('neurofy_roles').where('id', id).update(updateData);
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify(body),
        });
        const role = await (0, database_1.db)('neurofy_roles').where('id', id).first();
        res.json({
            data: {
                ...role,
                permissions: JSON.parse(role.permissions_json || '{}'),
                permissions_json: undefined,
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteRole(req, res) {
    try {
        const { id } = req.params;
        // Check if any users have this role
        const users = await (0, database_1.db)('neurofy_users').where('role', id).count('* as count').first();
        const userCount = users?.count || 0;
        if (userCount > 0) {
            return res.status(400).json({
                error: `Cannot delete this role because ${userCount} user${userCount > 1 ? 's are' : ' is'} assigned to it.`
            });
        }
        const role = await (0, database_1.db)('neurofy_roles').where('id', id).first();
        if (!role)
            return res.status(404).json({ error: 'Role not found' });
        const hasTrashTable = await database_1.db.schema.hasTable('neurofy_trash');
        if (!hasTrashTable) {
            await database_1.db.schema.createTable('neurofy_trash', (table) => {
                table.increments('trash_id').primary();
                table.string('item_id').notNullable();
                table.string('collection').notNullable();
                table.text('data_json').notNullable();
                table.string('deleted_by');
                table.timestamp('deleted_at').defaultTo(database_1.db.fn.now());
                table.timestamp('expires_at');
            });
            await database_1.db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await (0, database_1.db)('neurofy_trash').insert({
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
        await (0, database_1.db)('neurofy_roles').where('id', id).delete();
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify({ _action: 'moved_to_trash' }),
        });
        res.json({ success: true, movedToTrash: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getRolePermissions(req, res) {
    try {
        const role = await (0, database_1.db)('neurofy_roles').where('id', req.params.id).first();
        if (!role)
            return res.status(404).json({ error: 'Role not found' });
        const permissions = role.permissions_json ? JSON.parse(role.permissions_json) : {};
        res.json({ data: permissions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateRolePermissions(req, res) {
    try {
        const { id } = req.params;
        const permissions = req.body;
        let perms = permissions;
        if (Array.isArray(perms)) {
            perms = { collections: perms, _modules: {}, _api: {}, _pages: {} };
        }
        await (0, database_1.db)('neurofy_roles').where('id', id).update({
            permissions_json: JSON.stringify(perms)
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_roles',
            item: id,
            meta_json: JSON.stringify({ type: 'permissions_update' }),
        });
        res.json({ data: perms });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=roles.controller.js.map