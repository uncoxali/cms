import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireEditor } from '@/lib/auth';

// GET /api/pages — list all pages
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const parent = url.searchParams.get('parent_id');

    try {
        const navOnly = url.searchParams.get('nav') === '1';

        let query = db('neurofy_pages').select('*').orderBy('sort_order', 'asc').orderBy('title', 'asc');
        if (status && status !== 'all') query = query.where('status', status);
        if (parent) query = query.where('parent_id', parent);
        if (navOnly) query = query.where('show_in_nav', 1).where('status', 'published');

        const pages = await query;

        const data = pages.map((p: any) => ({
            ...p,
            roles: (() => { try { return JSON.parse(p.roles || '[]'); } catch { return []; } })(),
        }));

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/pages — create a new page
export async function POST(request: NextRequest) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    const body = await request.json();

    try {
        if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

        const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const path = body.path || `/${slug}`;

        const existing = await db('neurofy_pages').where('path', path).first();
        if (existing) return NextResponse.json({ error: `Path "${path}" already exists` }, { status: 409 });

        const [id] = await db('neurofy_pages').insert({
            title: body.title,
            path,
            slug,
            status: body.status || 'draft',
            layout: body.layout || 'default',
            content: body.content || '',
            meta_title: body.meta_title || body.title,
            meta_description: body.meta_description || '',
            parent_id: body.parent_id || null,
            sort_order: body.sort_order ?? 0,
            icon: body.icon || null,
            show_in_nav: body.show_in_nav ? 1 : 0,
            roles: JSON.stringify(body.roles || ['admin', 'editor', 'viewer']),
            redirect_url: body.redirect_url || null,
            created_by: check.auth.email,
            updated_by: check.auth.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        await db('neurofy_activity').insert({
            action: 'create',
            user: check.auth.email,
            user_id: check.auth.userId,
            collection: 'neurofy_pages',
            item: String(id),
            meta_json: JSON.stringify({ title: body.title, path }),
        });

        const page = await db('neurofy_pages').where('id', id).first();
        return NextResponse.json({ data: page }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
