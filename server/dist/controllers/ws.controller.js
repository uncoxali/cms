"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpoints = getEndpoints;
exports.createEndpoint = createEndpoint;
exports.updateEndpoint = updateEndpoint;
exports.deleteEndpoint = deleteEndpoint;
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
async function getEndpoints(_req, res) {
    try {
        const endpoints = await (0, database_1.db)('neurofy_ws_endpoints').select('*').orderBy('created_at', 'desc');
        // Parse JSON fields
        const formatted = endpoints.map(ep => ({
            ...ep,
            events: JSON.parse(ep.events_json || '[]'),
            roles: JSON.parse(ep.roles_json || '[]'),
            auth_required: !!ep.auth_required
        }));
        res.json({ data: formatted });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch WebSocket endpoints' });
    }
}
async function createEndpoint(req, res) {
    try {
        const { name, path, collection, events, auth_required, roles, status, description } = req.body;
        if (!name || !path) {
            res.status(400).json({ error: 'Name and path are required' });
            return;
        }
        const id = (0, uuid_1.v4)();
        await (0, database_1.db)('neurofy_ws_endpoints').insert({
            id,
            name,
            path,
            collection: collection || null,
            events_json: JSON.stringify(events || []),
            auth_required: auth_required !== false,
            roles_json: JSON.stringify(roles || []),
            status: status || 'active',
            description: description || null
        });
        res.status(201).json({ data: { id } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create WebSocket endpoint' });
    }
}
async function updateEndpoint(req, res) {
    try {
        const { id } = req.params;
        const { name, path, collection, events, auth_required, roles, status, description } = req.body;
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (path !== undefined)
            data.path = path;
        if (collection !== undefined)
            data.collection = collection || null;
        if (events !== undefined)
            data.events_json = JSON.stringify(events);
        if (auth_required !== undefined)
            data.auth_required = !!auth_required;
        if (roles !== undefined)
            data.roles_json = JSON.stringify(roles);
        if (status !== undefined)
            data.status = status;
        if (description !== undefined)
            data.description = description || null;
        await (0, database_1.db)('neurofy_ws_endpoints').where('id', id).update(data);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update WebSocket endpoint' });
    }
}
async function deleteEndpoint(req, res) {
    try {
        const { id } = req.params;
        await (0, database_1.db)('neurofy_ws_endpoints').where('id', id).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete WebSocket endpoint' });
    }
}
//# sourceMappingURL=ws.controller.js.map