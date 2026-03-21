import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

async function ensureTableExists(tableName: string) {
    try {
        const tables = await db.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        return tables && tables.length > 0;
    } catch {
        return false;
    }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
        const range = (req.query.range as string) || '30d';

        const now = new Date();
        let startDate = new Date();
        switch (range) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case '90d': startDate.setDate(now.getDate() - 90); break;
            default: startDate = new Date(0);
        }
        const startDateStr = startDate.toISOString();

        const hasItems = await ensureTableExists('neurofy_items');
        if (!hasItems) {
            await db.schema.createTable('neurofy_items', (table: any) => {
                table.string('id').primary();
                table.string('collection').notNullable();
                table.text('data_json');
                table.string('created_by');
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());
            });
        }

        const [totalItems] = await db('neurofy_items').count('* as count');
        const [totalUsers] = await db('neurofy_users').count('* as count').catch(() => [{ count: 0 }]);
        const [totalFiles] = await db('neurofy_files').count('* as count').catch(() => [{ count: 0 }]);

        const prevStartDate = new Date(startDate);
        const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
        const prevStartDateStr = prevStartDate.toISOString();

        const [prevItems] = await db('neurofy_items').where('created_at', '<', prevStartDateStr).count('* as count').catch(() => [{ count: 0 }]);
        const [prevUsers] = await db('neurofy_users').where('created_at', '<', prevStartDateStr).count('* as count').catch(() => [{ count: 0 }]);
        const [prevFiles] = await db('neurofy_files').where('created_at', '<', prevStartDateStr).count('* as count').catch(() => [{ count: 0 }]);

        const itemsGrowth = (prevItems as any).count > 0
            ? Math.round((((totalItems as any).count - (prevItems as any).count) / (prevItems as any).count) * 100)
            : 100;
        const usersGrowth = (prevUsers as any).count > 0
            ? Math.round((((totalUsers as any).count - (prevUsers as any).count) / (prevUsers as any).count) * 100)
            : 100;
        const filesGrowth = (prevFiles as any).count > 0
            ? Math.round((((totalFiles as any).count - (prevFiles as any).count) / (prevFiles as any).count) * 100)
            : 100;

        let collections: any[] = [];
        try {
            collections = await db('neurofy_collections').select('*');
        } catch {
            collections = [];
        }

        const contentByCollection = await Promise.all(collections.map(async (col: any) => {
            try {
                const [countResult] = await db('neurofy_items').where('collection', col.name).count('* as count');
                const [createdResult] = await db('neurofy_items')
                    .where('collection', col.name)
                    .where('created_at', '>=', startDateStr)
                    .count('* as count');
                const [updatedResult] = await db('neurofy_items')
                    .where('collection', col.name)
                    .where('updated_at', '>=', startDateStr)
                    .count('* as count');

                return {
                    collection: col.name,
                    label: col.label || col.name,
                    count: (countResult as any).count || 0,
                    created: (createdResult as any).count || 0,
                    updated: (updatedResult as any).count || 0,
                };
            } catch {
                return {
                    collection: col.name,
                    label: col.label || col.name,
                    count: 0,
                    created: 0,
                    updated: 0,
                };
            }
        }));

        let activityLogs: any[] = [];
        try {
            activityLogs = await db('neurofy_activity')
                .where('timestamp', '>=', startDateStr)
                .select('*');
        } catch {
            activityLogs = [];
        }

        const timelineMap: Record<string, { creates: number; updates: number; deletes: number; logins: number }> = {};

        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            timelineMap[dateKey] = { creates: 0, updates: 0, deletes: 0, logins: 0 };
        }

        activityLogs.forEach((log: any) => {
            const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
            if (timelineMap[dateKey]) {
                switch (log.action) {
                    case 'create': timelineMap[dateKey].creates++; break;
                    case 'update': timelineMap[dateKey].updates++; break;
                    case 'delete': timelineMap[dateKey].deletes++; break;
                    case 'login': timelineMap[dateKey].logins++; break;
                }
            }
        });

        const activityTimeline = Object.entries(timelineMap).map(([date, data]) => ({
            date,
            ...data,
        })).sort((a, b) => a.date.localeCompare(b.date));

        const userActivity: Record<string, { name: string; email: string; actions: number; lastActive: string }> = {};
        activityLogs.forEach((log: any) => {
            const userName = log.user || 'Unknown';
            if (!userActivity[userName]) {
                userActivity[userName] = { name: userName, email: userName, actions: 0, lastActive: log.timestamp };
            }
            userActivity[userName].actions++;
            if (new Date(log.timestamp) > new Date(userActivity[userName].lastActive)) {
                userActivity[userName].lastActive = log.timestamp;
            }
        });

        const topUsers = Object.values(userActivity)
            .sort((a, b) => b.actions - a.actions)
            .slice(0, 10);

        const todayActivities = activityLogs.filter((l: any) =>
            new Date(l.timestamp).toDateString() === now.toDateString()
        ).length;

        const recentMetrics = [
            { label: 'Total Items', value: (totalItems as any).count || 0, change: itemsGrowth, trend: itemsGrowth > 0 ? 'up' : itemsGrowth < 0 ? 'down' : 'neutral' as const },
            { label: 'Total Users', value: (totalUsers as any).count || 0, change: usersGrowth, trend: usersGrowth > 0 ? 'up' : usersGrowth < 0 ? 'down' : 'neutral' as const },
            { label: 'Total Files', value: (totalFiles as any).count || 0, change: filesGrowth, trend: filesGrowth > 0 ? 'up' : filesGrowth < 0 ? 'down' : 'neutral' as const },
            { label: "Today's Activity", value: todayActivities, change: 0, trend: 'neutral' as const },
        ];

        res.json({
            data: {
                overview: {
                    totalItems: (totalItems as any).count || 0,
                    totalUsers: (totalUsers as any).count || 0,
                    totalFiles: (totalFiles as any).count || 0,
                    totalViews: 0,
                    itemsGrowth,
                    usersGrowth,
                    filesGrowth,
                },
                contentByCollection,
                activityTimeline,
                topUsers,
                recentMetrics,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
