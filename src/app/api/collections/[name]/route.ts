import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { name } = await params;

    try {
        const db = getDb();

        const systemTables = [
            'neurofy_users',
            'neurofy_roles',
            'neurofy_activity',
            'neurofy_files',
            'neurofy_folders',
            'neurofy_flows',
            'neurofy_flow_logs',
            'neurofy_settings',
            'neurofy_collections_meta',
        ];

        if (systemTables.includes(name)) {
            return NextResponse.json({ error: 'Cannot delete system collections' }, { status: 403 });
        }

        const exists = await db.schema.hasTable(name);
        if (!exists) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

        await db.raw(`DROP TABLE IF EXISTS "${name}"`);
        await db('neurofy_collections_meta').where('collection', name).delete();
        await db('neurofy_relations')
            .where('collection', name)
            .orWhere('related_collection', name)
            .delete()
            .catch(() => { });

        await db('neurofy_activity').where('collection', name).delete().catch(() => { });
        await db('neurofy_translations').where('collection', name).delete().catch(() => { });

        // NEW: Clean up permissions from roles
        const roles = await db('neurofy_roles').select('id', 'permissions_json');
        for (const role of roles) {
            try {
                const perms = JSON.parse(role.permissions_json || '{}');
                if (perms[name]) {
                    delete perms[name];
                    await db('neurofy_roles')
                        .where('id', role.id)
                        .update({ permissions_json: JSON.stringify(perms) });
                }
            } catch (e) {
                console.error(`Failed to update permissions for role ${role.id}:`, e);
            }
        }

        await db('neurofy_activity').insert({
            action: 'delete',
            user: auth.email,
            user_id: auth.userId,
            collection: 'neurofy_collections',
            item: name,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
