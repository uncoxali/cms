import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

// GET /api/items/[collection]/[id] — get single item
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection, id } = await params;
    const db = getDb();

    try {
        const item = await db(collection).where('id', id).first();
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        return NextResponse.json({ data: item });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/items/[collection]/[id] — update item
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection, id } = await params;
    const db = getDb();

    try {
        const body = await request.json();

        // Update timestamp if column exists
        const columns = await db.raw(`PRAGMA table_info('${collection}')`);
        const colNames = columns.map((c: any) => c.name);
        if (colNames.includes('date_updated')) body.date_updated = new Date().toISOString();

        const count = await db(collection).where('id', id).update(body);
        if (count === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        // Log activity
        await db('directus_activity').insert({
            action: 'update',
            user: auth.email,
            user_id: auth.userId,
            collection,
            item: id,
            meta_json: JSON.stringify(body),
        });

        const item = await db(collection).where('id', id).first();
        return NextResponse.json({ data: item });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/items/[collection]/[id] — delete item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection, id } = await params;
    const db = getDb();

    try {
        const item = await db(collection).where('id', id).first();
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        await db(collection).where('id', id).delete();

        // Log activity
        await db('directus_activity').insert({
            action: 'delete',
            user: auth.email,
            user_id: auth.userId,
            collection,
            item: id,
            meta_json: JSON.stringify(item),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
