import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getPages(req: AuthenticatedRequest, res: Response) {
    try {
        const status = req.query.status as string;
        const parent = req.query.parent_id as string;
        const navOnly = req.query.nav === '1';

        let query = db('neurofy_pages').select('*').orderBy('sort_order', 'asc').orderBy('title', 'asc');
        if (status && status !== 'all') query = query.where('status', status);
        if (parent) query = query.where('parent_id', parent);
        if (navOnly) query = query.where('show_in_nav', 1).where('status', 'published');

        const pages = await query;

        const data = pages.map((p: any) => ({
            ...p,
            roles: (() => { try { return JSON.parse(p.roles || '[]'); } catch { return []; } })(),
        }));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getPage(req: AuthenticatedRequest, res: Response) {
    try {
        const page = await db('neurofy_pages').where('id', req.params.id).first();
        if (!page) return res.status(404).json({ error: 'Page not found' });

        try { page.roles = JSON.parse(page.roles || '[]'); } catch { page.roles = []; }
        res.json({ data: page });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createPage(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;

        if (!body.title) return res.status(400).json({ error: 'Title is required' });

        const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const path = body.path || `/${slug}`;

        const existing = await db('neurofy_pages').where('path', path).first();
        if (existing) return res.status(409).json({ error: `Path "${path}" already exists` });

        const [id] = await db('neurofy_pages').insert({
            title: body.title,
            path,
            slug,
            status: body.status || 'draft',
            layout: body.layout || 'default',
            content: body.content || '',
            meta_title: body.meta_title || body.title,
            meta_description: body.meta_description || '',
            parent_id: body.parent_id || null,
            sort_order: body.sort_order ?? 0,
            icon: body.icon || null,
            show_in_nav: body.show_in_nav ? 1 : 0,
            roles: JSON.stringify(body.roles || ['admin', 'editor', 'viewer']),
            redirect_url: body.redirect_url || null,
            created_by: req.auth?.email || 'system',
            updated_by: req.auth?.email || 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        await db('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_pages',
            item: String(id),
            meta_json: JSON.stringify({ title: body.title, path }),
        });

        const page = await db('neurofy_pages').where('id', id).first();
        res.json({ data: page });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updatePage(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;

        const existing = await db('neurofy_pages').where('id', id).first();
        if (!existing) return res.status(404).json({ error: 'Page not found' });

        if (body.path && body.path !== existing.path) {
            const dup = await db('neurofy_pages').where('path', body.path).whereNot('id', id).first();
            if (dup) return res.status(409).json({ error: `Path "${body.path}" already exists` });
        }

        const updates: any = { updated_at: new Date().toISOString(), updated_by: req.auth?.email || 'system' };
        const allowed = ['title', 'path', 'slug', 'status', 'layout', 'content', 'meta_title', 'meta_description', 'parent_id', 'sort_order', 'icon', 'show_in_nav', 'redirect_url'];
        for (const key of allowed) {
            if (body[key] !== undefined) {
                updates[key] = key === 'show_in_nav' ? (body[key] ? 1 : 0) : body[key];
            }
        }
        if (body.roles !== undefined) {
            updates.roles = JSON.stringify(body.roles);
        }

        await db('neurofy_pages').where('id', id).update(updates);

        await db('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_pages',
            item: String(id),
            meta_json: JSON.stringify(updates),
        });

        const page = await db('neurofy_pages').where('id', id).first();
        res.json({ data: page });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deletePage(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        const page = await db('neurofy_pages').where('id', id).first();
        if (!page) return res.status(404).json({ error: 'Page not found' });

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
            collection: 'neurofy_pages',
            data_json: JSON.stringify({
                ...page,
                roles: page.roles ? JSON.parse(page.roles) : [],
                _collection_label: 'Pages',
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
        });

        await db('neurofy_pages').where('parent_id', id).update({ parent_id: null });
        await db('neurofy_pages').where('id', id).delete();

        await db('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_pages',
            item: String(id),
            meta_json: JSON.stringify({ title: page.title, path: page.path, _action: 'moved_to_trash' }),
        });

        res.json({ success: true, movedToTrash: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
