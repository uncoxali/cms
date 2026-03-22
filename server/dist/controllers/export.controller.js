"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportData = exportData;
exports.importData = importData;
const database_1 = require("../config/database");
async function exportData(req, res) {
    try {
        const format = req.query.format || 'json';
        const collection = req.query.collection;
        let items;
        if (collection) {
            items = await (0, database_1.db)('neurofy_items').where('collection', collection).select('*');
        }
        else {
            items = await (0, database_1.db)('neurofy_items').select('*');
        }
        const data = items.map((item) => ({
            id: item.id,
            collection: item.collection,
            ...JSON.parse(item.data_json || '{}'),
            created_at: item.created_at,
            updated_at: item.updated_at,
        }));
        if (format === 'csv') {
            if (data.length === 0) {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="export_${Date.now()}.csv"`);
                return res.send('');
            }
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(h => {
                    const val = row[h];
                    if (val === null || val === undefined)
                        return '';
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(',')),
            ];
            const csv = csvRows.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="export_${collection || 'all'}_${Date.now()}.csv"`);
            return res.send(csv);
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="export_${collection || 'all'}_${Date.now()}.json"`);
        res.send(JSON.stringify(data, null, 2));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function importData(req, res) {
    try {
        const formData = req.body;
        const file = formData.file;
        const collection = formData.collection;
        if (!file || !collection) {
            return res.status(400).json({ error: 'File and collection are required' });
        }
        const text = await file.text();
        let data = [];
        if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            data = Array.isArray(parsed) ? parsed : [parsed];
        }
        else {
            const lines = text.split('\n').filter((l) => l.trim());
            if (lines.length > 1) {
                const headers = parseCSVLine(lines[0]);
                data = lines.slice(1).map((line) => {
                    const values = parseCSVLine(line);
                    return headers.reduce((acc, h, i) => {
                        acc[h] = values[i] || '';
                        return acc;
                    }, {});
                });
            }
        }
        if (data.length === 0) {
            return res.status(400).json({ error: 'No data to import' });
        }
        const errors = [];
        let imported = 0;
        const { v4: uuidv4 } = require('uuid');
        for (const row of data) {
            try {
                const id = row.id || uuidv4();
                const now = new Date().toISOString();
                const { id: _, created_at, updated_at, collection: c, ...cleanData } = row;
                await (0, database_1.db)('neurofy_items').insert({
                    id,
                    collection,
                    data_json: JSON.stringify(cleanData),
                    created_at: created_at || now,
                    updated_at: updated_at || now,
                    created_by: req.auth?.email || 'system',
                }).onConflict('id').merge({
                    data_json: JSON.stringify(cleanData),
                    updated_at: now,
                });
                imported++;
            }
            catch (err) {
                errors.push(`Row ${imported + errors.length + 1}: ${err.message}`);
            }
        }
        res.json({
            success: true,
            imported,
            errors: errors.slice(0, 10),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
//# sourceMappingURL=export.controller.js.map