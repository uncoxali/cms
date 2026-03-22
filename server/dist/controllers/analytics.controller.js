"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = getAnalytics;
const database_1 = require("../config/database");
async function ensureTableExists(tableName) {
    try {
        return await database_1.db.schema.hasTable(tableName);
    }
    catch {
        return false;
    }
}
async function getAnalytics(req, res) {
    try {
        const range = req.query.range || '30d';
        const now = new Date();
        let startDate = new Date();
        switch (range) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            default: startDate = new Date(0);
        }
        const startDateStr = startDate.toISOString();
        const hasItems = await ensureTableExists('neurofy_items');
        if (!hasItems) {
            await database_1.db.schema.createTable('neurofy_items', (table) => {
                table.string('id').primary();
                table.string('collection').notNullable();
                table.text('data_json');
                table.string('created_by');
                table.timestamp('created_at').defaultTo(database_1.db.fn.now());
                table.timestamp('updated_at').defaultTo(database_1.db.fn.now());
            });
        }
        const [totalItems] = await (0, database_1.db)('neurofy_items').count('* as count');
        const [totalUsers] = await (0, database_1.db)('neurofy_users').count('* as count').catch(() => [{ count: 0 }]);
        const [totalFiles] = await (0, database_1.db)('neurofy_files').count('* as count').catch(() => [{ count: 0 }]);
        const prevStartDate = new Date(startDate);
        const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
        const prevStartDateStr = prevStartDate.toISOString();
        const [prevItems] = await (0, database_1.db)('neurofy_items').where('created_at', '<', prevStartDateStr).count('* as count').catch(() => [{ count: 0 }]);
        const [prevUsers] = await (0, database_1.db)('neurofy_users').where('created_at', '<', prevStartDateStr).count('* as count').catch(() => [{ count: 0 }]);
        const [prevFiles] = await (0, database_1.db)('neurofy_files').where('created_at', '<', prevStartDateStr).count('* as count').catch(() => [{ count: 0 }]);
        const itemsGrowth = prevItems.count > 0
            ? Math.round(((totalItems.count - prevItems.count) / prevItems.count) * 100)
            : 100;
        const usersGrowth = prevUsers.count > 0
            ? Math.round(((totalUsers.count - prevUsers.count) / prevUsers.count) * 100)
            : 100;
        const filesGrowth = prevFiles.count > 0
            ? Math.round(((totalFiles.count - prevFiles.count) / prevFiles.count) * 100)
            : 100;
        let collections = [];
        try {
            collections = await (0, database_1.db)('neurofy_collections').select('*');
        }
        catch {
            collections = [];
        }
        const contentByCollection = await Promise.all(collections.map(async (col) => {
            try {
                const [countResult] = await (0, database_1.db)('neurofy_items').where('collection', col.name).count('* as count');
                const [createdResult] = await (0, database_1.db)('neurofy_items')
                    .where('collection', col.name)
                    .where('created_at', '>=', startDateStr)
                    .count('* as count');
                const [updatedResult] = await (0, database_1.db)('neurofy_items')
                    .where('collection', col.name)
                    .where('updated_at', '>=', startDateStr)
                    .count('* as count');
                return {
                    collection: col.name,
                    label: col.label || col.name,
                    count: countResult.count || 0,
                    created: createdResult.count || 0,
                    updated: updatedResult.count || 0,
                };
            }
            catch {
                return {
                    collection: col.name,
                    label: col.label || col.name,
                    count: 0,
                    created: 0,
                    updated: 0,
                };
            }
        }));
        let activityLogs = [];
        try {
            activityLogs = await (0, database_1.db)('neurofy_activity')
                .where('timestamp', '>=', startDateStr)
                .select('*');
        }
        catch {
            activityLogs = [];
        }
        const timelineMap = {};
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            timelineMap[dateKey] = { creates: 0, updates: 0, deletes: 0, logins: 0 };
        }
        activityLogs.forEach((log) => {
            const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
            if (timelineMap[dateKey]) {
                switch (log.action) {
                    case 'create':
                        timelineMap[dateKey].creates++;
                        break;
                    case 'update':
                        timelineMap[dateKey].updates++;
                        break;
                    case 'delete':
                        timelineMap[dateKey].deletes++;
                        break;
                    case 'login':
                        timelineMap[dateKey].logins++;
                        break;
                }
            }
        });
        const activityTimeline = Object.entries(timelineMap).map(([date, data]) => ({
            date,
            ...data,
        })).sort((a, b) => a.date.localeCompare(b.date));
        const userActivity = {};
        activityLogs.forEach((log) => {
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
        const todayActivities = activityLogs.filter((l) => new Date(l.timestamp).toDateString() === now.toDateString()).length;
        const recentMetrics = [
            { label: 'Total Items', value: totalItems.count || 0, change: itemsGrowth, trend: itemsGrowth > 0 ? 'up' : itemsGrowth < 0 ? 'down' : 'neutral' },
            { label: 'Total Users', value: totalUsers.count || 0, change: usersGrowth, trend: usersGrowth > 0 ? 'up' : usersGrowth < 0 ? 'down' : 'neutral' },
            { label: 'Total Files', value: totalFiles.count || 0, change: filesGrowth, trend: filesGrowth > 0 ? 'up' : filesGrowth < 0 ? 'down' : 'neutral' },
            { label: "Today's Activity", value: todayActivities, change: 0, trend: 'neutral' },
        ];
        res.json({
            data: {
                overview: {
                    totalItems: totalItems.count || 0,
                    totalUsers: totalUsers.count || 0,
                    totalFiles: totalFiles.count || 0,
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=analytics.controller.js.map