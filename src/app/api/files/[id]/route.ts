import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireEditor } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

type RouteParams = { params: Promise<Record<string, string>> }

// GET /api/files/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const file = await db('neurofy_files').where('id', id).first();
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    return NextResponse.json({
        data: { ...file, tags: file.tags_json ? JSON.parse(file.tags_json) : [], tags_json: undefined },
    });
}

// PATCH /api/files/[id] (editor+ only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const updateData: any = { modified_on: new Date().toISOString() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.folder !== undefined) updateData.folder = body.folder;
    if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite;
    if (body.tags !== undefined) updateData.tags_json = JSON.stringify(body.tags);

    await db('neurofy_files').where('id', id).update(updateData);
    return NextResponse.json({ success: true });
}

// DELETE /api/files/[id] — soft delete file to trash (editor+ only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const check = await requireEditor(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { id } = await params;
    const db = getDb();

    const file = await db('neurofy_files').where('id', id).first();
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    // Ensure trash table exists
    const hasTrashTable = await db.schema.hasTable('neurofy_trash');
    if (!hasTrashTable) {
        await db.schema.createTable('neurofy_trash', (table) => {
            table.increments('trash_id').primary();
            table.string('item_id').notNullable();
            table.string('collection').notNullable();
            table.text('data_json').notNullable();
            table.string('deleted_by');
            table.timestamp('deleted_at').defaultTo(db.fn.now());
            table.timestamp('expires_at');
        });
        await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
    }

    // Move to trash with 30 days expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db('neurofy_trash').insert({
        item_id: id,
        collection: 'neurofy_files',
        data_json: JSON.stringify({
            ...file,
            tags: file.tags_json ? JSON.parse(file.tags_json) : [],
            tags_json: undefined,
            _collection_label: 'Files',
        }),
        deleted_by: check.auth.email,
        deleted_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
    });

    // Delete from files table (keep physical file for restore)
    await db('neurofy_files').where('id', id).delete();

    await db('neurofy_activity').insert({
        action: 'delete', user: check.auth.email, user_id: check.auth.userId,
        collection: 'neurofy_files', item: id,
        meta_json: JSON.stringify({ filename: file.filename_download, _action: 'moved_to_trash' }),
    });

    return NextResponse.json({ success: true, movedToTrash: true });
}
