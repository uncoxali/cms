import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/relations?collection=xxx — get all relations for a collection
// GET /api/relations — get all relations
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');

    try {
        let query = db('neurofy_relations').select('*');
        if (collection) query = query.where('collection', collection);
        const relations = await query;
        return NextResponse.json({ data: relations });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
