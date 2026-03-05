import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/flows — list all flows
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const flows = await db('directus_flows').select('*');

    const data = flows.map((f: any) => ({
        ...f,
        trigger_options: f.trigger_options_json ? JSON.parse(f.trigger_options_json) : {},
        operations: f.operations_json ? JSON.parse(f.operations_json) : [],
        trigger_options_json: undefined,
        operations_json: undefined,
    }));

    return NextResponse.json({ data });
}

// POST /api/flows — create flow
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const db = getDb();
    const body = await request.json();
    const id = `flow_${Date.now().toString(36)}`;

    await db('directus_flows').insert({
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

    await db('directus_activity').insert({
        action: 'create', user: auth.email, user_id: auth.userId,
        collection: 'directus_flows', item: id,
        meta_json: JSON.stringify({ name: body.name }),
    });

    return NextResponse.json({ data: { id, ...body } }, { status: 201 });
}
