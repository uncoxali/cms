import { Response } from 'express';
import { db } from '../config/database';
import { hashPassword, AuthenticatedRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';

export async function getUsers(req: AuthenticatedRequest, res: Response) {
    try {
        const users = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .select('neurofy_users.*', 'neurofy_roles.name as role_name')
            .orderBy('neurofy_users.created_at', 'desc');
        res.json({ data: users });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUser(req: AuthenticatedRequest, res: Response) {
    try {
        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', req.params.id)
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.permissions_json')
            .first();
        if (!user) return res.status(404).json({ error: 'User not found' });
        let permissions = [];
        try { permissions = user.permissions_json ? JSON.parse(user.permissions_json) : []; } catch {}
        res.json({ data: { ...user, permissions, permissions_json: undefined } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
    try {
        const { email, password, first_name, last_name, role, status } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const existing = await db('neurofy_users').where('email', email).first();
        if (existing) return res.status(409).json({ error: 'Email already exists' });

        const newId = uuidv4();
        const passwordHash = await hashPassword(password || uuidv4().substring(0, 12));
        await db('neurofy_users').insert({
            id: newId,
            email, password_hash: passwordHash,
            first_name: first_name || '', last_name: last_name || '',
            role: role || 'role_viewer', status: status || (password ? 'active' : 'invited'),
            created_at: new Date().toISOString(),
        });

        await db('neurofy_activity').insert({
            action: 'create', user: req.auth?.email || 'system',
            user_id: req.auth?.userId, collection: 'neurofy_users',
            item: newId, meta_json: JSON.stringify({ email, role }),
        });

        res.json({ data: { id: newId, email } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
    try {
        const updateData: any = {};
        const fields = ['first_name', 'last_name', 'email', 'role', 'status', 'phone', 'job_title', 'locale', 'timezone', 'avatar'];
        fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
        
        if (req.body.password) {
            updateData.password_hash = await hashPassword(req.body.password);
        }

        await db('neurofy_users').where('id', req.params.id).update(updateData);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        // Fetch user before deleting
        const user = await db('neurofy_users').where('id', id).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Ensure trash table exists
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

        // Insert into trash
        await db('neurofy_trash').insert({
            item_id: id,
            collection: 'neurofy_users',
            data_json: JSON.stringify({
                ...user,
                _collection_label: 'Users',
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
        });

        // Delete from users
        await db('neurofy_users').where('id', id).delete();

        // Add activity log 
        await db('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_users',
            item: id,
            meta_json: JSON.stringify({ email: user.email, role: user.role, _action: 'moved_to_trash' }),
        });

        res.json({ success: true, movedToTrash: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
