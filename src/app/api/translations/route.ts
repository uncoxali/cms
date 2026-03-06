import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const itemId = searchParams.get('item_id');
    const locale = searchParams.get('locale');

    if (!collection || !itemId) {
        return NextResponse.json({ error: 'collection and item_id are required' }, { status: 400 });
    }

    let query = db('neurofy_translations')
        .where({ collection, item_id: itemId });

    if (locale) {
        query = query.where({ locale });
    }

    const rows = await query.orderBy('field');
    return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();
    const { collection, item_id, field, locale, value } = body;

    if (!collection || !item_id || !field || !locale) {
        return NextResponse.json(
            { error: 'collection, item_id, field, and locale are required' },
            { status: 400 }
        );
    }

    const existing = await db('neurofy_translations')
        .where({ collection, item_id, field, locale })
        .first();

    if (existing) {
        await db('neurofy_translations')
            .where({ id: existing.id })
            .update({ value, updated_at: new Date().toISOString() });
        return NextResponse.json({ data: { ...existing, value } });
    }

    const [id] = await db('neurofy_translations').insert({
        collection,
        item_id,
        field,
        locale,
        value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ data: { id, collection, item_id, field, locale, value } }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db('neurofy_translations').where({ id }).delete();
    return NextResponse.json({ success: true });
}
