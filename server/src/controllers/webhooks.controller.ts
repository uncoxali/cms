import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getWebhooks(req: AuthenticatedRequest, res: Response) {
    try {
        const webhooks = await db('neurofy_webhooks')
            .select('*')
            .orderBy('created_at', 'desc');

        res.json({
            data: webhooks.map((w: any) => ({
                id: w.id,
                name: w.name,
                method: w.method || 'POST',
                url: w.url,
                status: w.status || 'active',
                collections: w.collections_json ? JSON.parse(w.collections_json) : [],
                events: w.events_json ? JSON.parse(w.events_json) : [],
                headers: w.headers_json ? JSON.parse(w.headers_json) : [],
                auth: w.auth_json ? JSON.parse(w.auth_json) : { type: 'none' },
                last_triggered: w.last_triggered,
                success_rate: w.success_rate || 100,
                date_created: w.created_at,
            })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getWebhook(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const webhook = await db('neurofy_webhooks').where('id', id).first();

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.json({
            data: {
                id: webhook.id,
                name: webhook.name,
                method: webhook.method,
                url: webhook.url,
                status: webhook.status,
                collections: webhook.collections_json ? JSON.parse(webhook.collections_json) : [],
                events: webhook.events_json ? JSON.parse(webhook.events_json) : [],
                headers: webhook.headers_json ? JSON.parse(webhook.headers_json) : [],
                auth: webhook.auth_json ? JSON.parse(webhook.auth_json) : { type: 'none' },
                last_triggered: webhook.last_triggered,
                success_rate: webhook.success_rate,
                date_created: webhook.created_at,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createWebhook(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;
        const { name, method, url, collections, events, headers, auth: authData, status } = body;

        if (!name || !url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }

        const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db('neurofy_webhooks').insert({
            id,
            name,
            method: method || 'POST',
            url,
            collections_json: JSON.stringify(collections || []),
            events_json: JSON.stringify(events || []),
            headers_json: JSON.stringify(headers || []),
            auth_json: JSON.stringify(authData || { type: 'none' }),
            status: status || 'active',
            success_rate: 100,
            created_at: new Date().toISOString(),
        });

        res.json({
            data: {
                id,
                name,
                method: method || 'POST',
                url,
                collections: collections || [],
                events: events || [],
                headers: headers || [],
                auth: authData || { type: 'none' },
                status: status || 'active',
                successRate: 100,
                dateCreated: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateWebhook(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;
        const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.method !== undefined) updateData.method = body.method;
        if (body.url !== undefined) updateData.url = body.url;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.collections !== undefined) updateData.collections_json = JSON.stringify(body.collections);
        if (body.events !== undefined) updateData.events_json = JSON.stringify(body.events);
        if (body.headers !== undefined) updateData.headers_json = JSON.stringify(body.headers);
        if (body.auth !== undefined) updateData.auth_json = JSON.stringify(body.auth);

        await db('neurofy_webhooks').where('id', id).update(updateData);

        const updated = await db('neurofy_webhooks').where('id', id).first();

        res.json({
            data: {
                id: updated.id,
                name: updated.name,
                method: updated.method,
                url: updated.url,
                status: updated.status,
                collections: updated.collections_json ? JSON.parse(updated.collections_json) : [],
                events: updated.events_json ? JSON.parse(updated.events_json) : [],
                headers: updated.headers_json ? JSON.parse(updated.headers_json) : [],
                auth: updated.auth_json ? JSON.parse(updated.auth_json) : { type: 'none' },
                last_triggered: updated.last_triggered,
                success_rate: updated.success_rate,
                date_created: updated.created_at,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteWebhook(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('neurofy_webhooks').where('id', id).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function testWebhook(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const webhook = await db('neurofy_webhooks').where('id', id).first();

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        await db('neurofy_webhooks').where('id', id).update({
            last_triggered: new Date().toISOString(),
        });

        res.json({ success: true, message: 'Webhook test triggered' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getWebhookLogs(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        res.json({ data: [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
