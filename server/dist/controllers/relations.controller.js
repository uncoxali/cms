"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelations = getRelations;
exports.createRelation = createRelation;
exports.deleteRelation = deleteRelation;
const database_1 = require("../config/database");
// GET /api/relations
async function getRelations(req, res) {
    try {
        const collection = req.query.collection;
        let query = (0, database_1.db)('neurofy_relations').select('*');
        if (collection)
            query = query.where('collection', collection);
        const relations = await query;
        res.json({ data: relations });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// POST /api/relations
async function createRelation(req, res) {
    try {
        const { collection, field, related_collection, related_field, display_field, on_delete, required } = req.body;
        if (!collection || !field || !related_collection) {
            return res.status(400).json({ error: 'collection, field, and related_collection are required' });
        }
        const [id] = await (0, database_1.db)('neurofy_relations').insert({
            collection,
            field,
            related_collection,
            related_field: related_field || 'id',
            display_field: display_field || 'id',
            on_delete: on_delete || 'SET NULL',
            required: required ? 1 : 0,
        });
        res.json({ data: { id } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// DELETE /api/relations/:id
async function deleteRelation(req, res) {
    try {
        const { id } = req.params;
        await (0, database_1.db)('neurofy_relations').where('id', id).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=relations.controller.js.map