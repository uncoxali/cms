import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

// GET /api/translations
export async function getTranslations(req: AuthenticatedRequest, res: Response) {
    try {
        const collection = req.query.collection as string;
        const itemId = req.query.item_id as string;
        const locale = req.query.locale as string;

        if (!collection || !itemId) {
            return res.status(400).json({ error: 'collection and item_id are required' });
        }

        let query = db('neurofy_translations').where({ collection, item_id: itemId });
        if (locale) query = query.where({ locale });

        const rows = await query.orderBy('field');
        res.json({ data: rows });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/translations
export async function createOrUpdateTranslation(req: AuthenticatedRequest, res: Response) {
    try {
        const { collection, item_id, field, locale, value } = req.body;

        if (!collection || !item_id || !field || !locale) {
            return res.status(400).json({ error: 'collection, item_id, field, and locale are required' });
        }

        const existing = await db('neurofy_translations')
            .where({ collection, item_id, field, locale }).first();

        if (existing) {
            await db('neurofy_translations')
                .where({ id: existing.id })
                .update({ value, updated_at: new Date().toISOString() });
            return res.json({ data: { ...existing, value } });
        }

        const [id] = await db('neurofy_translations').insert({
            collection, item_id, field, locale, value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        res.status(201).json({ data: { id, collection, item_id, field, locale, value } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// DELETE /api/translations
export async function deleteTranslation(req: AuthenticatedRequest, res: Response) {
    try {
        const id = req.query.id as string;
        if (!id) return res.status(400).json({ error: 'id is required' });

        await db('neurofy_translations').where({ id }).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
