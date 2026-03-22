"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrash = getTrash;
exports.emptyTrash = emptyTrash;
exports.restoreItem = restoreItem;
exports.permanentDelete = permanentDelete;
const database_1 = require("../config/database");
const config_1 = require("../config");
const date_1 = require("../utils/date");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function getTrash(req, res) {
    try {
        const collection = req.query.collection;
        const hasTrashTable = await database_1.db.schema.hasTable('neurofy_trash');
        if (!hasTrashTable) {
            return res.json({ data: [] });
        }
        let query = (0, database_1.db)('neurofy_trash').select('*');
        if (collection)
            query = query.where('collection', collection);
        const items = await query.orderBy('deleted_at', 'desc');
        let collections = {};
        try {
            const cols = await (0, database_1.db)('neurofy_collections').select('name', 'label');
            cols.forEach((c) => { collections[c.name] = c.label || c.name; });
        }
        catch { }
        const data = items.map((item) => ({
            id: item.item_id || item.id,
            trashId: item.trash_id,
            collection: item.collection,
            collectionLabel: collections[item.collection] || item.collection,
            data: item.data_json ? JSON.parse(item.data_json) : {},
            deletedBy: item.deleted_by || 'Unknown',
            deletedAt: item.deleted_at,
            expiresAt: item.expires_at,
        }));
        res.json({ data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function emptyTrash(req, res) {
    try {
        await (0, database_1.db)('neurofy_trash').delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function restoreItem(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;
        if (body.action === 'restore') {
            const item = await (0, database_1.db)('neurofy_trash')
                .where('item_id', id)
                .orWhere('trash_id', id)
                .first();
            if (!item)
                return res.status(404).json({ error: 'Item not found' });
            const data = JSON.parse(item.data_json);
            const collection = item.collection;
            const { _collection_label, _action, tags, ...cleanData } = data;
            const restoreData = { ...cleanData, id: data.id || id };
            if (collection === 'neurofy_pages') {
                const { roles, ...pageData } = restoreData;
                await (0, database_1.db)('neurofy_pages').insert({
                    ...pageData,
                    roles: Array.isArray(roles) ? JSON.stringify(roles) : roles || '[]',
                    updated_at: (0, date_1.toDbDate)(),
                }).onConflict('id').merge();
            }
            else if (collection === 'neurofy_files') {
                const { tags: fileTags, ...fileData } = restoreData;
                await (0, database_1.db)('neurofy_files').insert({
                    ...fileData,
                    tags_json: Array.isArray(fileTags) ? JSON.stringify(fileTags) : fileTags || '[]',
                    modified_on: (0, date_1.toDbDate)(),
                    deleted_at: null,
                }).onConflict('id').merge();
            }
            else if (collection === 'neurofy_users') {
                await (0, database_1.db)('neurofy_users').insert(restoreData).onConflict('id').merge();
            }
            else if (collection === 'neurofy_roles') {
                await (0, database_1.db)('neurofy_roles').insert(restoreData).onConflict('id').merge();
            }
            else {
                const exists = await database_1.db.schema.hasTable(collection);
                if (exists) {
                    await (0, database_1.db)(collection).insert(restoreData).onConflict('id').merge();
                }
                else {
                    return res.status(400).json({ error: `Cannot restore: table ${collection} does not exist.` });
                }
            }
            await (0, database_1.db)('neurofy_trash').where('item_id', id).orWhere('trash_id', id).delete();
            await (0, database_1.db)('neurofy_activity').insert({
                action: 'create',
                user: req.auth?.email || 'system',
                user_id: req.auth?.userId,
                collection,
                item: id,
                meta_json: JSON.stringify({ _action: 'restored_from_trash' }),
            });
            return res.json({ success: true });
        }
        res.status(400).json({ error: 'Invalid action' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function permanentDelete(req, res) {
    try {
        const { id } = req.params;
        const item = await (0, database_1.db)('neurofy_trash')
            .where('item_id', id)
            .orWhere('trash_id', id)
            .first();
        if (item && item.collection === 'neurofy_files') {
            try {
                const data = JSON.parse(item.data_json);
                if (data.filename_disk) {
                    const filePath = path_1.default.join(config_1.config.uploadDir, data.filename_disk);
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                    }
                }
            }
            catch { }
            // Permanently delete the file row from database
            await (0, database_1.db)('neurofy_files').where('id', id).delete();
        }
        await (0, database_1.db)('neurofy_trash')
            .where('item_id', id)
            .orWhere('trash_id', id)
            .delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=trash.controller.js.map