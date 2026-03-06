import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireEditor } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

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

        let items = await query;

        // Populate relations: ?populate=* or ?populate=field1,field2
        const populate = url.searchParams.get('populate');
        if (populate && items.length > 0) {
            const relations = await db('neurofy_relations').where('collection', collection).catch(() => []);
            const fieldsToPopulate = populate === '*'
                ? relations.map((r: any) => r.field)
                : populate.split(',').map((f: string) => f.trim());

            for (const rel of relations) {
                if (!fieldsToPopulate.includes(rel.field)) continue;
                const relatedIds = [...new Set(items.map((item: any) => item[rel.field]).filter(Boolean))];
                if (relatedIds.length === 0) continue;

                const relatedItems = await db(rel.related_collection)
                    .whereIn(rel.related_field || 'id', relatedIds)
                    .select('*');
                const relatedMap = new Map(relatedItems.map((ri: any) => [ri[rel.related_field || 'id'], ri]));

                items = items.map((item: any) => ({
                    ...item,
                    [`${rel.field}_data`]: relatedMap.get(item[rel.field]) || null,
                }));
            }
        }

        // Apply translations if ?locale=xx is specified
        const locale = url.searchParams.get('locale');
        if (locale && items.length > 0) {
            const itemIds = items.map((item: any) => String(item.id));
            const translations = await db('neurofy_translations')
                .where({ collection, locale })
                .whereIn('item_id', itemIds);

            if (translations.length > 0) {
                const transMap = new Map<string, Map<string, string>>();
                for (const tr of translations) {
                    if (!transMap.has(tr.item_id)) transMap.set(tr.item_id, new Map());
                    transMap.get(tr.item_id)!.set(tr.field, tr.value);
                }
                items = items.map((item: any) => {
                    const fieldMap = transMap.get(String(item.id));
                    if (!fieldMap) return item;
                    const translated = { ...item };
                    for (const [field, value] of fieldMap) {
                        translated[field] = value;
                    }
                    return translated;
                });
            }
        }

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

// POST /api/items/[collection] — create item (editor+ only)
export async function POST(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { collection } = await params;
    const db = getDb();

    try {
        const body = await request.json();

        // Add timestamps if columns exist
        const columns = await db.raw(`PRAGMA table_info('${collection}')`);
        const colNames = columns.map((c: any) => c.name);
        if (colNames.includes('date_created')) body.date_created = new Date().toISOString();
        if (colNames.includes('date_updated')) body.date_updated = new Date().toISOString();

        // Validate foreign key references
        const relations = await db('neurofy_relations').where('collection', collection).catch(() => []);
        for (const rel of relations) {
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

        const [id] = await db(collection).insert(body);

        // Log activity
        await db('neurofy_activity').insert({
            action: 'create',
            user: check.auth.email,
            user_id: check.auth.userId,
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
