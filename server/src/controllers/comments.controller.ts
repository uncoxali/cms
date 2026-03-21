import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getComments(req: AuthenticatedRequest, res: Response) {
    try {
        const collection = req.query.collection as string;
        const itemId = req.query.itemId as string;

        if (!collection || !itemId) {
            return res.status(400).json({ error: 'Missing collection or itemId' });
        }

        const comments = await db('field_comments')
            .where({ collection, item_id: itemId })
            .orderBy('created_at', 'desc')
            .select('*');

        const data = (comments as any[]).map(c => ({
            id: c.id,
            collection: c.collection,
            itemId: c.item_id,
            fieldName: c.field_name,
            userId: c.user_id,
            userName: c.user_name,
            userAvatar: c.user_avatar,
            content: c.content,
            timestamp: c.created_at,
            resolved: Boolean(c.resolved),
            resolvedBy: c.resolved_by,
            resolvedAt: c.resolved_at,
        }));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createComment(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;
        const { collection, itemId, fieldName, userId, userName, userAvatar, content } = body;

        if (!collection || !itemId || !fieldName || !userId || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const timestamp = new Date().toISOString();

        await db('field_comments').insert({
            id,
            collection,
            item_id: String(itemId),
            field_name: fieldName,
            user_id: String(userId),
            user_name: userName,
            user_avatar: userAvatar || null,
            content,
            resolved: 0,
            created_at: timestamp,
        });

        const data = {
            id,
            collection,
            itemId,
            fieldName,
            userId,
            userName,
            userAvatar,
            content,
            timestamp,
            resolved: false,
        };

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateComment(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;
        const { resolved, resolvedBy } = body;

        const updateData: Record<string, any> = {};

        if (typeof resolved === 'boolean') {
            updateData.resolved = resolved ? 1 : 0;
            updateData.resolved_at = resolved ? new Date().toISOString() : null;
            if (resolvedBy) updateData.resolved_by = resolvedBy;
        }

        await db('field_comments').where({ id }).update(updateData);

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('field_comments').where({ id }).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
