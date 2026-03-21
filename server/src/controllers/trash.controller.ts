import { Response } from 'express';
import { db } from '../config/database';
import { config } from '../config';
import { AuthenticatedRequest } from '../utils/auth';
import { toDbDate } from '../utils/date';
import fs from 'fs';
import path from 'path';

export async function getTrash(req: AuthenticatedRequest, res: Response) {
    try {
        const collection = req.query.collection as string;

        const hasTrashTable = await db.schema.hasTable('neurofy_trash');
        if (!hasTrashTable) {
            return res.json({ data: [] });
        }

        let query = db('neurofy_trash').select('*');
        if (collection) query = query.where('collection', collection);

        const items = await query.orderBy('deleted_at', 'desc');

        let collections: Record<string, string> = {};
        try {
            const cols = await db('neurofy_collections').select('name', 'label');
            cols.forEach((c: any) => { collections[c.name] = c.label || c.name; });
        } catch {}

        const data = items.map((item: any) => ({
            id: item.item_id || item.id,
            trashId: item.trash_id,
            collection: item.collection,
            collectionLabel: collections[item.collection] || item.collection,
            data: item.data_json ? JSON.parse(item.data_json) : {},
            deletedBy: item.deleted_by || 'Unknown',
            deletedAt: item.deleted_at,
            expiresAt: item.expires_at,
        }));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function emptyTrash(req: AuthenticatedRequest, res: Response) {
    try {
        await db('neurofy_trash').delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function restoreItem(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;

        if (body.action === 'restore') {
            const item = await db('neurofy_trash')
                .where('item_id', id)
                .orWhere('trash_id', id)
                .first();
            if (!item) return res.status(404).json({ error: 'Item not found' });

            const data = JSON.parse(item.data_json);
            const collection = item.collection;

            const { _collection_label, _action, tags, ...cleanData } = data;
            const restoreData = { ...cleanData, id: data.id || id };

            if (collection === 'neurofy_pages') {
                const { roles, ...pageData } = restoreData;
                await db('neurofy_pages').insert({
                    ...pageData,
                    roles: Array.isArray(roles) ? JSON.stringify(roles) : roles || '[]',
                    updated_at: toDbDate(),
                }).onConflict('id').merge();
            } else if (collection === 'neurofy_files') {
                const { tags: fileTags, uploaded_on, modified_on, ...fileData } = restoreData;
                await db('neurofy_files').insert({
                    ...fileData,
                    uploaded_on: uploaded_on ? toDbDate(new Date(uploaded_on)) : undefined,
                    modified_on: modified_on ? toDbDate(new Date(modified_on)) : toDbDate(),
                    tags_json: Array.isArray(fileTags) ? JSON.stringify(fileTags) : fileTags || '[]',
                    deleted_at: null,
                }).onConflict('id').merge();
            } else if (collection === 'neurofy_users') {
                await db('neurofy_users').insert(restoreData).onConflict('id').merge();
            } else if (collection === 'neurofy_roles') {
                await db('neurofy_roles').insert(restoreData).onConflict('id').merge();
            } else {
                const exists = await db.schema.hasTable(collection);
                if (exists) {
                    await db(collection).insert(restoreData).onConflict('id').merge();
                } else {
                    return res.status(400).json({ error: `Cannot restore: table ${collection} does not exist.` });
                }
            }

            await db('neurofy_trash').where('item_id', id).orWhere('trash_id', id).delete();

            await db('neurofy_activity').insert({
                action: 'create',
                user: req.auth?.email || 'system',
                user_id: req.auth?.userId,
                collection,
                item: id,
                meta_json: JSON.stringify({ _action: 'restored_from_trash' }),
            });

            return res.json({ success: true });
        }

        res.status(400).json({ error: 'Invalid action' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function permanentDelete(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        const item = await db('neurofy_trash')
            .where('item_id', id)
            .orWhere('trash_id', id)
            .first();

        if (item && item.collection === 'neurofy_files') {
            try {
                const data = JSON.parse(item.data_json);
                if (data.filename_disk) {
                    const filePath = path.join(config.uploadDir, data.filename_disk);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            } catch {}
            // Permanently delete the file row from database
            await db('neurofy_files').where('id', id).delete();
        }

        await db('neurofy_trash')
            .where('item_id', id)
            .orWhere('trash_id', id)
            .delete();

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
