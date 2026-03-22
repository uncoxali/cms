"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInit = checkInit;
exports.initializeDb = initializeDb;
const database_1 = require("../config/database");
// GET /api/init — check if DB is initialized
async function checkInit(_req, res) {
    try {
        const hasUsers = await database_1.db.schema.hasTable('neurofy_users');
        if (!hasUsers) {
            return res.json({ initialized: false });
        }
        const users = await (0, database_1.db)('neurofy_users').count('* as count').first();
        res.json({
            initialized: true,
            userCount: users?.count || 0,
        });
    }
    catch {
        res.json({ initialized: false });
    }
}
// POST /api/init — initialize database
async function initializeDb(_req, res) {
    try {
        // Tables should already be created via migrations in the main app
        // This endpoint verifies the DB is accessible
        const hasUsers = await database_1.db.schema.hasTable('neurofy_users');
        if (hasUsers) {
            const users = await (0, database_1.db)('neurofy_users').count('* as count').first();
            return res.json({ success: true, message: 'Database already initialized', userCount: users?.count || 0 });
        }
        res.json({ success: true, message: 'Database initialized successfully' });
    }
    catch (error) {
        console.error('[INIT]', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
//# sourceMappingURL=init.controller.js.map