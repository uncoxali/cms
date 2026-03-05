import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams { params: Promise<{ name: string }> }

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { name } = await params;

    try {
        const db = getDb();

        const systemTables = [
            'directus_users',
            'directus_roles',
            'directus_activity',
            'directus_files',
            'directus_folders',
            'directus_flows',
            'directus_flow_logs',
            'directus_settings',
            'directus_collections_meta',
        ];

        if (systemTables.includes(name)) {
            return NextResponse.json({ error: 'Cannot delete system collections' }, { status: 403 });
        }

        const exists = await db.schema.hasTable(name);
        if (!exists) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

        await db.schema.dropTableIfExists(name);
        await db('directus_collections_meta').where('collection', name).delete();

        await db('directus_activity').insert({
            action: 'delete',
            user: auth.email,
            user_id: auth.userId,
            collection: 'directus_collections',
            item: name,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
