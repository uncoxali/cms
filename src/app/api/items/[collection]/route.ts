import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ collection: string }>;
}

// GET /api/items/[collection] — list items with filter/sort/page/limit
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection } = await params;
    const db = getDb();

    try {
        const exists = await db.schema.hasTable(collection);
        if (!exists) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const sort = url.searchParams.get('sort') || 'id';
        const order = url.searchParams.get('order') || 'asc';
        const search = url.searchParams.get('search') || '';
        const fields = url.searchParams.get('fields'); // comma-separated
        const filter = url.searchParams.get('filter'); // JSON filter

        let query = db(collection);

        // Select fields
        if (fields) {
            query = query.select(fields.split(',').map(f => f.trim()));
        } else {
            query = query.select('*');
        }

        // Search — searches across all text columns
        if (search) {
            const columns = await db.raw(`PRAGMA table_info('${collection}')`);
            const textCols = columns
                .filter((c: any) => ['TEXT', 'VARCHAR', 'CHAR', ''].includes((c.type || '').toUpperCase().split('(')[0]))
                .map((c: any) => c.name);

            if (textCols.length > 0) {
                query = query.where(function (this: any) {
                    for (const col of textCols) {
                        this.orWhere(col, 'like', `%${search}%`);
                    }
                });
            }
        }

        // JSON filter: { "field": { "_eq": "value" } }
        if (filter) {
            try {
                const parsed = JSON.parse(filter);
                for (const [field, condition] of Object.entries(parsed)) {
                    const cond = condition as Record<string, any>;
                    if (cond._eq !== undefined) query = query.where(field, '=', cond._eq);
                    if (cond._neq !== undefined) query = query.where(field, '!=', cond._neq);
                    if (cond._gt !== undefined) query = query.where(field, '>', cond._gt);
                    if (cond._gte !== undefined) query = query.where(field, '>=', cond._gte);
                    if (cond._lt !== undefined) query = query.where(field, '<', cond._lt);
                    if (cond._lte !== undefined) query = query.where(field, '<=', cond._lte);
                    if (cond._contains !== undefined) query = query.where(field, 'like', `%${cond._contains}%`);
                    if (cond._null !== undefined) cond._null ? query.whereNull(field) : query.whereNotNull(field);
                    if (cond._in !== undefined) query = query.whereIn(field, cond._in);
                }
            } catch { /* ignore invalid filter */ }
        }

        // Get total count (before pagination)
        const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
        const total = ((await countQuery) as any)?.total || 0;

        // Sort
        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? 'desc' : order;
        query = query.orderBy(sortField, sortOrder);

        // Pagination
        const offset = (page - 1) * limit;
        query = query.limit(limit).offset(offset);

        const items = await query;

        return NextResponse.json({
            data: items,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/items/[collection] — create item
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection } = await params;
    const db = getDb();

    try {
        const body = await request.json();

        // Add timestamps if columns exist
        const columns = await db.raw(`PRAGMA table_info('${collection}')`);
        const colNames = columns.map((c: any) => c.name);
        if (colNames.includes('date_created')) body.date_created = new Date().toISOString();
        if (colNames.includes('date_updated')) body.date_updated = new Date().toISOString();

        const [id] = await db(collection).insert(body);

        // Log activity
        await db('directus_activity').insert({
            action: 'create',
            user: auth.email,
            user_id: auth.userId,
            collection,
            item: String(id),
            meta_json: JSON.stringify(body),
        });

        const item = await db(collection).where('id', id).first();
        return NextResponse.json({ data: item }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
