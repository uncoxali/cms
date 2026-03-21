import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getFlows(req: AuthenticatedRequest, res: Response) {
    try {
        const flows = await db('neurofy_flows').select('*');

        const data = flows.map((f: any) => ({
            ...f,
            trigger_options: f.trigger_options_json ? JSON.parse(f.trigger_options_json) : {},
            operations: f.operations_json ? JSON.parse(f.operations_json) : [],
            trigger_options_json: undefined,
            operations_json: undefined,
        }));

        res.json({ data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getFlow(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const flow = await db('neurofy_flows').where('id', id).first();
        if (!flow) return res.status(404).json({ error: 'Flow not found' });

        const logs = await db('neurofy_flow_logs').where('flow_id', id).orderBy('started_at', 'desc').limit(50);

        res.json({
            data: {
                ...flow,
                trigger_options: flow.trigger_options_json ? JSON.parse(flow.trigger_options_json) : {},
                operations: flow.operations_json ? JSON.parse(flow.operations_json) : [],
                trigger_options_json: undefined,
                operations_json: undefined,
                logs: logs.map((l: any) => ({
                    ...l,
                    steps: l.steps_json ? JSON.parse(l.steps_json) : [],
                    steps_json: undefined,
                })),
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createFlow(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;
        const id = `flow_${Date.now().toString(36)}`;

        await db('neurofy_flows').insert({
            id,
            name: body.name,
            description: body.description || null,
            icon: body.icon || null,
            color: body.color || null,
            status: body.status || 'active',
            trigger_type: body.trigger_type || 'manual',
            trigger_options_json: JSON.stringify(body.trigger_options || {}),
            operations_json: JSON.stringify(body.operations || []),
            permission: body.permission || '$full',
        });

        await db('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_flows',
            item: id,
            meta_json: JSON.stringify({ name: body.name }),
        });

        res.json({ data: { id, ...body } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateFlow(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.icon !== undefined) updateData.icon = body.icon;
        if (body.color !== undefined) updateData.color = body.color;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.trigger_type !== undefined) updateData.trigger_type = body.trigger_type;
        if (body.trigger_options !== undefined) updateData.trigger_options_json = JSON.stringify(body.trigger_options);
        if (body.operations !== undefined) updateData.operations_json = JSON.stringify(body.operations);
        if (body.permission !== undefined) updateData.permission = body.permission;

        await db('neurofy_flows').where('id', id).update(updateData);

        await db('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_flows',
            item: id,
            meta_json: JSON.stringify(body),
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteFlow(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        await db('neurofy_flows').where('id', id).delete();

        await db('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_flows',
            item: id,
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
