import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

// GET /api/relations
export async function getRelations(req: AuthenticatedRequest, res: Response) {
    try {
        const collection = req.query.collection as string;
        let query = db('neurofy_relations').select('*');
        if (collection) query = query.where('collection', collection);
        const relations = await query;
        res.json({ data: relations });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/relations
export async function createRelation(req: AuthenticatedRequest, res: Response) {
    try {
        const { collection, field, related_collection, related_field, display_field, on_delete, required } = req.body;
        if (!collection || !field || !related_collection) {
            return res.status(400).json({ error: 'collection, field, and related_collection are required' });
        }
        const [id] = await db('neurofy_relations').insert({
            collection,
            field,
            related_collection,
            related_field: related_field || 'id',
            display_field: display_field || 'id',
            on_delete: on_delete || 'SET NULL',
            required: required ? 1 : 0,
        });
        res.json({ data: { id } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// DELETE /api/relations/:id
export async function deleteRelation(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('neurofy_relations').where('id', id).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
