"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivity = getActivity;
exports.createActivity = createActivity;
exports.deleteActivity = deleteActivity;
exports.clearActivity = clearActivity;
const database_1 = require("../config/database");
async function getActivity(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const action = req.query.action;
        const collection = req.query.collection;
        const userId = req.query.user_id;
        let query = (0, database_1.db)('neurofy_activity').select('*');
        if (action && action !== 'all')
            query = query.where('action', action);
        if (collection)
            query = query.where('collection', collection);
        if (userId)
            query = query.where('user_id', userId);
        const total = (await query.clone().clearSelect().clearOrder().count('* as total').first())?.total || 0;
        const logs = await query.orderBy('timestamp', 'desc').limit(limit).offset((page - 1) * limit);
        const data = logs.map((log) => ({
            ...log,
            meta: log.meta_json ? JSON.parse(log.meta_json) : null,
            meta_json: undefined,
        }));
        res.json({ data, meta: { total, page, limit } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function createActivity(req, res) {
    try {
        const body = req.body;
        const [id] = await (0, database_1.db)('neurofy_activity').insert({
            action: body.action || 'update',
            user: body.user || req.auth?.email || 'system',
            user_id: body.user_id || req.auth?.userId,
            collection: body.collection || null,
            item: body.item || null,
            comment: body.comment || null,
            meta_json: body.meta ? JSON.stringify(body.meta) : null,
        });
        res.json({ data: { id } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteActivity(req, res) {
    try {
        const { id } = req.params;
        await (0, database_1.db)('neurofy_activity').where('id', id).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function clearActivity(req, res) {
    try {
        await (0, database_1.db)('neurofy_activity').delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=activity.controller.js.map