import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireEditor } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/pages/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    try {
        const page = await db('neurofy_pages').where('id', id).first();
        if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        try { page.roles = JSON.parse(page.roles || '[]'); } catch { page.roles = []; }
        return NextResponse.json({ data: page });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/pages/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    try {
        const existing = await db('neurofy_pages').where('id', id).first();
        if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

        if (body.path && body.path !== existing.path) {
            const dup = await db('neurofy_pages').where('path', body.path).whereNot('id', id).first();
            if (dup) return NextResponse.json({ error: `Path "${body.path}" already exists` }, { status: 409 });
        }

        const updates: any = { updated_at: new Date().toISOString(), updated_by: check.auth.email };
        const allowed = ['title', 'path', 'slug', 'status', 'layout', 'content', 'meta_title', 'meta_description', 'parent_id', 'sort_order', 'icon', 'show_in_nav', 'redirect_url'];
        for (const key of allowed) {
            if (body[key] !== undefined) {
                updates[key] = key === 'show_in_nav' ? (body[key] ? 1 : 0) : body[key];
            }
        }
        if (body.roles !== undefined) {
            updates.roles = JSON.stringify(body.roles);
        }

        await db('neurofy_pages').where('id', id).update(updates);

        await db('neurofy_activity').insert({
            action: 'update',
            user: check.auth.email,
            user_id: check.auth.userId,
            collection: 'neurofy_pages',
            item: String(id),
            meta_json: JSON.stringify(updates),
        });

        const page = await db('neurofy_pages').where('id', id).first();
        return NextResponse.json({ data: page });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/pages/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { id } = await params;
    const db = getDb();

    try {
        const page = await db('neurofy_pages').where('id', id).first();
        if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

        // Unparent children
        await db('neurofy_pages').where('parent_id', id).update({ parent_id: null });
        await db('neurofy_pages').where('id', id).delete();

        await db('neurofy_activity').insert({
            action: 'delete',
            user: check.auth.email,
            user_id: check.auth.userId,
            collection: 'neurofy_pages',
            item: String(id),
            meta_json: JSON.stringify({ title: page.title, path: page.path }),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
