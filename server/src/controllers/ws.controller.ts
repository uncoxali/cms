import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';

export async function getEndpoints(_req: AuthenticatedRequest, res: Response) {
    try {
        const endpoints = await db('neurofy_ws_endpoints').select('*').orderBy('created_at', 'desc');
        
        // Parse JSON fields
        const formatted = endpoints.map(ep => ({
            ...ep,
            events: JSON.parse(ep.events_json || '[]'),
            roles: JSON.parse(ep.roles_json || '[]'),
            auth_required: !!ep.auth_required
        }));

        res.json({ data: formatted });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch WebSocket endpoints' });
    }
}

export async function createEndpoint(req: AuthenticatedRequest, res: Response) {
    try {
        const { name, path, collection, events, auth_required, roles, status, description } = req.body;
        
        if (!name || !path) {
            res.status(400).json({ error: 'Name and path are required' });
            return;
        }

        const id = uuidv4();
        await db('neurofy_ws_endpoints').insert({
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to create WebSocket endpoint' });
    }
}

export async function updateEndpoint(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const { name, path, collection, events, auth_required, roles, status, description } = req.body;

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (path !== undefined) data.path = path;
        if (collection !== undefined) data.collection = collection || null;
        if (events !== undefined) data.events_json = JSON.stringify(events);
        if (auth_required !== undefined) data.auth_required = !!auth_required;
        if (roles !== undefined) data.roles_json = JSON.stringify(roles);
        if (status !== undefined) data.status = status;
        if (description !== undefined) data.description = description || null;

        await db('neurofy_ws_endpoints').where('id', id).update(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update WebSocket endpoint' });
    }
}

export async function deleteEndpoint(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('neurofy_ws_endpoints').where('id', id).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete WebSocket endpoint' });
    }
}
