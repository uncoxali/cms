"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhooks = getWebhooks;
exports.getWebhook = getWebhook;
exports.createWebhook = createWebhook;
exports.updateWebhook = updateWebhook;
exports.deleteWebhook = deleteWebhook;
exports.testWebhook = testWebhook;
exports.getWebhookLogs = getWebhookLogs;
const database_1 = require("../config/database");
async function getWebhooks(req, res) {
    try {
        const webhooks = await (0, database_1.db)('neurofy_webhooks')
            .select('*')
            .orderBy('created_at', 'desc');
        res.json({
            data: webhooks.map((w) => ({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getWebhook(req, res) {
    try {
        const { id } = req.params;
        const webhook = await (0, database_1.db)('neurofy_webhooks').where('id', id).first();
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function createWebhook(req, res) {
    try {
        const body = req.body;
        const { name, method, url, collections, events, headers, auth: authData, status } = body;
        if (!name || !url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }
        const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await (0, database_1.db)('neurofy_webhooks').insert({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateWebhook(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;
        const updateData = { updated_at: new Date().toISOString() };
        if (body.name !== undefined)
            updateData.name = body.name;
        if (body.method !== undefined)
            updateData.method = body.method;
        if (body.url !== undefined)
            updateData.url = body.url;
        if (body.status !== undefined)
            updateData.status = body.status;
        if (body.collections !== undefined)
            updateData.collections_json = JSON.stringify(body.collections);
        if (body.events !== undefined)
            updateData.events_json = JSON.stringify(body.events);
        if (body.headers !== undefined)
            updateData.headers_json = JSON.stringify(body.headers);
        if (body.auth !== undefined)
            updateData.auth_json = JSON.stringify(body.auth);
        await (0, database_1.db)('neurofy_webhooks').where('id', id).update(updateData);
        const updated = await (0, database_1.db)('neurofy_webhooks').where('id', id).first();
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteWebhook(req, res) {
    try {
        const { id } = req.params;
        await (0, database_1.db)('neurofy_webhooks').where('id', id).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function testWebhook(req, res) {
    try {
        const { id } = req.params;
        const webhook = await (0, database_1.db)('neurofy_webhooks').where('id', id).first();
        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        await (0, database_1.db)('neurofy_webhooks').where('id', id).update({
            last_triggered: new Date().toISOString(),
        });
        res.json({ success: true, message: 'Webhook test triggered' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getWebhookLogs(req, res) {
    try {
        const { id } = req.params;
        res.json({ data: [] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=webhooks.controller.js.map