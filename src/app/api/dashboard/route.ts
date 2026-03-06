import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const db = getDb();

        // Count total items across all user-created collections
        const systemTables = [
            'neurofy_users', 'neurofy_roles', 'neurofy_activity',
            'neurofy_files', 'neurofy_folders', 'neurofy_flows',
            'neurofy_flow_logs', 'neurofy_settings', 'neurofy_collections_meta',
        ];
        const tables = await db.raw(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name`
        );
        const userTables = tables.filter((t: any) => !systemTables.includes(t.name));

        let totalItems = 0;
        const collectionStats: { name: string; count: number }[] = [];
        for (const table of userTables) {
            try {
                const result = await db(table.name).count('* as count').first();
                const count = (result as any)?.count || 0;
                totalItems += Number(count);
                collectionStats.push({ name: table.name, count: Number(count) });
            } catch {
                // Table might not exist or be malformed
            }
        }

        // Active users (status = 'active')
        const activeUsersResult = await db('neurofy_users').where('status', 'active').count('* as count').first();
        const activeUsers = Number((activeUsersResult as any)?.count || 0);

        // Total users
        const totalUsersResult = await db('neurofy_users').count('* as count').first();
        const totalUsers = Number((totalUsersResult as any)?.count || 0);

        // Activity today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayActivityResult = await db('neurofy_activity')
            .where('timestamp', '>=', today.toISOString())
            .count('* as count').first();
        const todayEvents = Number((todayActivityResult as any)?.count || 0);

        // Total activity
        const totalActivityResult = await db('neurofy_activity').count('* as count').first();
        const totalActivity = Number((totalActivityResult as any)?.count || 0);

        // Active flows
        const activeFlowsResult = await db('neurofy_flows').where('status', 'active').count('* as count').first();
        const activeFlows = Number((activeFlowsResult as any)?.count || 0);

        // Files stats
        const filesCountResult = await db('neurofy_files').count('* as count').first();
        const filesCount = Number((filesCountResult as any)?.count || 0);

        const filesSizeResult = await db('neurofy_files').sum('filesize as total').first();
        const filesSize = Number((filesSizeResult as any)?.total || 0);

        // Recent activity
        const recentActivity = await db('neurofy_activity')
            .orderBy('timestamp', 'desc')
            .limit(10);

        return NextResponse.json({
            stats: {
                totalItems,
                activeUsers,
                totalUsers,
                todayEvents,
                totalActivity,
                activeFlows,
                filesCount,
                filesSize,
                collections: collectionStats,
            },
            recentActivity: recentActivity.map((a: any) => ({
                id: a.id,
                action: a.action,
                user: a.user,
                collection: a.collection,
                item: a.item,
                timestamp: a.timestamp,
                meta: a.meta_json ? JSON.parse(a.meta_json) : null,
            })),
        });
    } catch (error: any) {
        console.error('[DASHBOARD]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
