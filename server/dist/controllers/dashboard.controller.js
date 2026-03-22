"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const database_1 = require("../config/database");
const db_1 = require("../utils/db");
const SYSTEM_TABLES = [
    'neurofy_users', 'neurofy_roles', 'neurofy_activity',
    'neurofy_files', 'neurofy_folders', 'neurofy_flows',
    'neurofy_flow_logs', 'neurofy_settings', 'neurofy_collections_meta',
];
// GET /api/dashboard
async function getDashboard(req, res) {
    try {
        const tables = await (0, db_1.getTables)();
        const userTables = tables.filter((t) => !SYSTEM_TABLES.includes(t.name));
        let totalItems = 0;
        const collectionStats = [];
        for (const table of userTables) {
            try {
                const result = await (0, database_1.db)(table.name).count('* as count').first();
                const count = Number(result?.count || 0);
                totalItems += count;
                collectionStats.push({ name: table.name, count });
            }
            catch { }
        }
        const activeUsersResult = await (0, database_1.db)('neurofy_users').where('status', 'active').count('* as count').first();
        const activeUsers = Number(activeUsersResult?.count || 0);
        const totalUsersResult = await (0, database_1.db)('neurofy_users').count('* as count').first();
        const totalUsers = Number(totalUsersResult?.count || 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayActivityResult = await (0, database_1.db)('neurofy_activity')
            .where('timestamp', '>=', today.toISOString())
            .count('* as count').first();
        const todayEvents = Number(todayActivityResult?.count || 0);
        const totalActivityResult = await (0, database_1.db)('neurofy_activity').count('* as count').first();
        const totalActivity = Number(totalActivityResult?.count || 0);
        const activeFlowsResult = await (0, database_1.db)('neurofy_flows').where('status', 'active').count('* as count').first();
        const activeFlows = Number(activeFlowsResult?.count || 0);
        const filesCountResult = await (0, database_1.db)('neurofy_files').count('* as count').first();
        const filesCount = Number(filesCountResult?.count || 0);
        const filesSizeResult = await (0, database_1.db)('neurofy_files').sum('filesize as total').first();
        const filesSize = Number(filesSizeResult?.total || 0);
        const recentActivity = await (0, database_1.db)('neurofy_activity')
            .orderBy('timestamp', 'desc')
            .limit(10);
        res.json({
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
            recentActivity: recentActivity.map((a) => ({
                id: a.id,
                action: a.action,
                user: a.user,
                collection: a.collection,
                item: a.item,
                timestamp: a.timestamp,
                meta: a.meta_json ? JSON.parse(a.meta_json) : null,
            })),
        });
    }
    catch (error) {
        console.error('[DASHBOARD]', error);
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=dashboard.controller.js.map