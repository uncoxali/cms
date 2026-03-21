import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// POST /api/trash/[id] — restore item
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    try {
        if (body.action === 'restore') {
            // Find by item_id or trash_id
            const item = await db('neurofy_trash')
                .where('item_id', id)
                .orWhere('trash_id', id)
                .first();
            if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

            const data = JSON.parse(item.data_json);
            const collection = item.collection;

            // Clean up internal fields
            const { _collection_label, _action, tags, ...cleanData } = data;
            const restoreData = { ...cleanData, id: data.id || id };

            // Handle different collection types
            if (collection === 'neurofy_pages') {
                // Restore page
                const { roles, ...pageData } = restoreData;
                await db('neurofy_pages').insert({
                    ...pageData,
                    roles: Array.isArray(roles) ? JSON.stringify(roles) : roles || '[]',
                    updated_at: new Date().toISOString(),
                }).onConflict('id').merge();
            } else if (collection === 'neurofy_files') {
                // Restore file
                const { tags: fileTags, ...fileData } = restoreData;
                await db('neurofy_files').insert({
                    ...fileData,
                    tags_json: Array.isArray(fileTags) ? JSON.stringify(fileTags) : fileTags || '[]',
                    modified_on: new Date().toISOString(),
                }).onConflict('id').merge();
            } else {
                // Restore to generic items table
                await db('neurofy_items').insert({
                    id: restoreData.id,
                    collection,
                    data_json: JSON.stringify(restoreData),
                    created_at: restoreData.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: restoreData.created_by || auth.email,
                }).onConflict('id').merge();
            }

            // Remove from trash
            await db('neurofy_trash').where('item_id', id).orWhere('trash_id', id).delete();

            // Log activity
            await db('neurofy_activity').insert({
                action: 'create',
                user: auth.email,
                user_id: auth.userId,
                collection,
                item: id,
                meta_json: JSON.stringify({ _action: 'restored_from_trash' }),
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/trash/[id] — permanent delete
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const fs = await import('fs');
    const path = await import('path');

    try {
        const item = await db('neurofy_trash')
            .where('item_id', id)
            .orWhere('trash_id', id)
            .first();
        
        // If it's a file, also delete the physical file
        if (item && item.collection === 'neurofy_files') {
            try {
                const data = JSON.parse(item.data_json);
                if (data.filename_disk) {
                    const filePath = path.join(process.cwd(), 'public', 'uploads', data.filename_disk);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            } catch {}
        }

        await db('neurofy_trash')
            .where('item_id', id)
            .orWhere('trash_id', id)
            .delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
