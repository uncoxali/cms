import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

// GET /api/flows/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const flow = await db('neurofy_flows').where('id', id).first();
    if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 });

    // Get logs for this flow
    const logs = await db('neurofy_flow_logs').where('flow_id', id).orderBy('started_at', 'desc').limit(50);

    return NextResponse.json({
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
}

// PATCH /api/flows/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

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
        action: 'update', user: auth.email, user_id: auth.userId,
        collection: 'neurofy_flows', item: id,
        meta_json: JSON.stringify(body),
    });

    return NextResponse.json({ success: true });
}

// DELETE /api/flows/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();

    await db('neurofy_flows').where('id', id).delete();

    await db('neurofy_activity').insert({
        action: 'delete', user: auth.email, user_id: auth.userId,
        collection: 'neurofy_flows', item: id,
    });

    return NextResponse.json({ success: true });
}
