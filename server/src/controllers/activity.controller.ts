import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getActivity(req: AuthenticatedRequest, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const action = req.query.action as string;
        const collection = req.query.collection as string;
        const userId = req.query.user_id as string;

        let query = db('neurofy_activity').select('*');

        if (action && action !== 'all') query = query.where('action', action);
        if (collection) query = query.where('collection', collection);
        if (userId) query = query.where('user_id', userId);

        const total = ((await query.clone().clearSelect().clearOrder().count('* as total').first()) as any)?.total || 0;

        const logs = await query.orderBy('timestamp', 'desc').limit(limit).offset((page - 1) * limit);

        const data = logs.map((log: any) => ({
            ...log,
            meta: log.meta_json ? JSON.parse(log.meta_json) : null,
            meta_json: undefined,
        }));

        res.json({ data, meta: { total, page, limit } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createActivity(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;

        const [id] = await db('neurofy_activity').insert({
            action: body.action || 'update',
            user: body.user || req.auth?.email || 'system',
            user_id: body.user_id || req.auth?.userId,
            collection: body.collection || null,
            item: body.item || null,
            comment: body.comment || null,
            meta_json: body.meta ? JSON.stringify(body.meta) : null,
        });

        res.json({ data: { id } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteActivity(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('neurofy_activity').where('id', id).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function clearActivity(req: AuthenticatedRequest, res: Response) {
    try {
        await db('neurofy_activity').delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
