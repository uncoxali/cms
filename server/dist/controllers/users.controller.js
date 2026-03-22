"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const uuid_1 = require("uuid");
const date_1 = require("../utils/date");
async function getUsers(req, res) {
    try {
        const users = await (0, database_1.db)('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .select('neurofy_users.*', 'neurofy_roles.name as role_name')
            .orderBy('neurofy_users.created_at', 'desc');
        res.json({ data: users });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getUser(req, res) {
    try {
        const user = await (0, database_1.db)('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', req.params.id)
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.permissions_json')
            .first();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        let permissions = [];
        try {
            permissions = user.permissions_json ? JSON.parse(user.permissions_json) : [];
        }
        catch { }
        res.json({ data: { ...user, permissions, permissions_json: undefined } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function createUser(req, res) {
    try {
        const { email, password, first_name, last_name, role, status } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        const existing = await (0, database_1.db)('neurofy_users').where('email', email).first();
        if (existing)
            return res.status(409).json({ error: 'Email already exists' });
        const newId = (0, uuid_1.v4)();
        const passwordHash = await (0, auth_1.hashPassword)(password || (0, uuid_1.v4)().substring(0, 12));
        await (0, database_1.db)('neurofy_users').insert({
            id: newId,
            email, password_hash: passwordHash,
            first_name: first_name || '', last_name: last_name || '',
            role: role || 'role_viewer', status: status || (password ? 'active' : 'invited'),
            created_at: (0, date_1.toDbDate)(),
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'create', user: req.auth?.email || 'system',
            user_id: req.auth?.userId, collection: 'neurofy_users',
            item: newId, meta_json: JSON.stringify({ email, role }),
        });
        res.json({ data: { id: newId, email } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateUser(req, res) {
    try {
        const updateData = {};
        const fields = ['first_name', 'last_name', 'email', 'role', 'status', 'phone', 'job_title', 'locale', 'timezone', 'avatar'];
        fields.forEach(f => { if (req.body[f] !== undefined)
            updateData[f] = req.body[f]; });
        if (req.body.password) {
            updateData.password_hash = await (0, auth_1.hashPassword)(req.body.password);
        }
        await (0, database_1.db)('neurofy_users').where('id', req.params.id).update(updateData);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        // Fetch user before deleting
        const user = await (0, database_1.db)('neurofy_users').where('id', id).first();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Ensure trash table exists
        // Table is ensured in database.ts
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        // Insert into trash
        await (0, database_1.db)('neurofy_trash').insert({
            item_id: id,
            collection: 'neurofy_users',
            data_json: JSON.stringify({
                ...user,
                _collection_label: 'Users',
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: (0, date_1.toDbDate)(),
            expires_at: (0, date_1.toDbDate)(expiresAt),
        });
        // Delete from users
        await (0, database_1.db)('neurofy_users').where('id', id).delete();
        // Add activity log 
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_users',
            item: id,
            meta_json: JSON.stringify({ email: user.email, role: user.role, _action: 'moved_to_trash' }),
        });
        res.json({ success: true, movedToTrash: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=users.controller.js.map