import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/templates
export async function getTemplates(req: AuthenticatedRequest, res: Response) {
    try {
        const collection = req.query.collection as string;

        const hasTable = await db.schema.hasTable('neurofy_templates');
        if (!hasTable) {
            return res.json({ data: [] });
        }

        let query = db('neurofy_templates').select('*');
        if (collection) query = query.where('collection', collection);

        const templates = await query.orderBy('created_at', 'desc');

        const data = templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            collection: t.collection,
            data: t.data_json ? JSON.parse(t.data_json) : {},
            category: t.category || 'general',
            createdAt: t.created_at,
            updatedAt: t.updated_at,
        }));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/templates
export async function createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;
        const id = uuidv4();
        const now = new Date().toISOString();

        await db('neurofy_templates').insert({
            id,
            name: body.name,
            description: body.description || '',
            collection: body.collection,
            data_json: JSON.stringify(body.data || {}),
            category: body.category || 'general',
            created_by: req.auth?.email || 'system',
            created_at: now,
            updated_at: now,
        });

        res.status(201).json({ data: { id } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// PATCH /api/templates/:id
export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.data !== undefined) updateData.data_json = JSON.stringify(body.data);
        if (body.category !== undefined) updateData.category = body.category;

        await db('neurofy_templates').where('id', id).update(updateData);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// DELETE /api/templates/:id
export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('neurofy_templates').where('id', id).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
