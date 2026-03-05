import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

interface RouteParams { params: Promise<{ id: string }> }

// GET /api/files/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const file = await db('directus_files').where('id', id).first();
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    return NextResponse.json({
        data: { ...file, tags: file.tags_json ? JSON.parse(file.tags_json) : [], tags_json: undefined },
    });
}

// PATCH /api/files/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const updateData: any = { modified_on: new Date().toISOString() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.folder !== undefined) updateData.folder = body.folder;
    if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite;
    if (body.tags !== undefined) updateData.tags_json = JSON.stringify(body.tags);

    await db('directus_files').where('id', id).update(updateData);
    return NextResponse.json({ success: true });
}

// DELETE /api/files/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const file = await db('directus_files').where('id', id).first();
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    // Delete physical file if it exists
    if (file.filename_disk) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', file.filename_disk);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db('directus_files').where('id', id).delete();

    await db('directus_activity').insert({
        action: 'delete', user: auth.email, user_id: auth.userId,
        collection: 'directus_files', item: id,
        meta_json: JSON.stringify({ filename: file.filename_download }),
    });

    return NextResponse.json({ success: true });
}
