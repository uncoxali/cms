import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/activity — list activity logs with filters
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const action = url.searchParams.get('action');
    const collection = url.searchParams.get('collection');
    const userId = url.searchParams.get('user_id');

    try {
        let query = db('directus_activity').select('*');

        if (action && action !== 'all') query = query.where('action', action);
        if (collection) query = query.where('collection', collection);
        if (userId) query = query.where('user_id', userId);

        const total = ((await query.clone().clearSelect().clearOrder().count('* as total').first()) as any)?.total || 0;

        const logs = await query.orderBy('timestamp', 'desc').limit(limit).offset((page - 1) * limit);

        // Parse meta JSON
        const data = logs.map((log: any) => ({
            ...log,
            meta: log.meta_json ? JSON.parse(log.meta_json) : null,
            meta_json: undefined,
        }));

        return NextResponse.json({ data, meta: { total, page, limit } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/activity — create activity log
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();

    try {
        const [id] = await db('directus_activity').insert({
            action: body.action || 'update',
            user: body.user || auth.email,
            user_id: body.user_id || auth.userId,
            collection: body.collection || null,
            item: body.item || null,
            comment: body.comment || null,
            meta_json: body.meta ? JSON.stringify(body.meta) : null,
        });

        return NextResponse.json({ data: { id } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

