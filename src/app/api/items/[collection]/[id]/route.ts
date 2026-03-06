import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireEditor } from '@/lib/auth';

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

        // Populate relations
        const url = new URL(request.url);
        const populate = url.searchParams.get('populate');
        if (populate) {
            const relations = await db('neurofy_relations').where('collection', collection).catch(() => []);
            const fieldsToPopulate = populate === '*'
                ? relations.map((r: any) => r.field)
                : populate.split(',').map((f: string) => f.trim());

            for (const rel of relations) {
                if (!fieldsToPopulate.includes(rel.field)) continue;
                const fkValue = item[rel.field];
                if (fkValue) {
                    const related = await db(rel.related_collection)
                        .where(rel.related_field || 'id', fkValue)
                        .first();
                    item[`${rel.field}_data`] = related || null;
                }
            }
        }

        return NextResponse.json({ data: item });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/items/[collection]/[id] — update item (editor+ only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { collection, id } = await params;
    const db = getDb();

    try {
        const body = await request.json();

        // Update timestamp if column exists
        const columns = await db.raw(`PRAGMA table_info('${collection}')`);
        const colNames = columns.map((c: any) => c.name);
        if (colNames.includes('date_updated')) body.date_updated = new Date().toISOString();

        // Validate foreign key references
        const relations = await db('neurofy_relations').where('collection', collection).catch(() => []);
        for (const rel of relations) {
            if (!(rel.field in body)) continue;
            const value = body[rel.field];
            if (rel.required && (value === undefined || value === null || value === '')) {
                return NextResponse.json(
                    { error: `Field "${rel.field}" is required — you must select a ${rel.related_collection} item` },
                    { status: 400 }
                );
            }
            if (value !== undefined && value !== null && value !== '') {
                const exists = await db(rel.related_collection)
                    .where(rel.related_field || 'id', value).first();
                if (!exists) {
                    return NextResponse.json(
                        { error: `Invalid reference: ${rel.related_collection} with ${rel.related_field || 'id'} = ${value} does not exist` },
                        { status: 400 }
                    );
                }
            }
        }

        const count = await db(collection).where('id', id).update(body);
        if (count === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        // Log activity
        await db('neurofy_activity').insert({
            action: 'update',
            user: check.auth.email,
            user_id: check.auth.userId,
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

// DELETE /api/items/[collection]/[id] — delete item (editor+ only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { collection, id } = await params;
    const db = getDb();

    try {
        const item = await db(collection).where('id', id).first();
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        await db(collection).where('id', id).delete();

        // Log activity
        await db('neurofy_activity').insert({
            action: 'delete',
            user: check.auth.email,
            user_id: check.auth.userId,
            collection,
            item: id,
            meta_json: JSON.stringify(item),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
