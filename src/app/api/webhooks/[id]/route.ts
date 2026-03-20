import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    try {
        const webhook = await db('neurofy_webhooks').where('id', id).first();
        
        if (!webhook) {
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
        }

        return NextResponse.json({
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
    } catch (error) {
        console.error('Error fetching webhook:', error);
        return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();

    try {
        const body = await request.json();
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

        return NextResponse.json({
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
    } catch (error) {
        console.error('Error updating webhook:', error);
        return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();

    try {
        await db('neurofy_webhooks').where('id', id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }
}
