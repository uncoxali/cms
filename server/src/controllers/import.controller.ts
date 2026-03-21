import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// POST /api/import
export async function importData(req: AuthenticatedRequest, res: Response) {
    try {
        const file = req.file;
        const collection = req.body.collection;

        if (!file || !collection) {
            return res.status(400).json({ error: 'File and collection are required' });
        }

        const text = file.buffer.toString('utf-8');
        let data: any[] = [];

        if (file.originalname.endsWith('.json')) {
            const parsed = JSON.parse(text);
            data = Array.isArray(parsed) ? parsed : [parsed];
        } else {
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length > 1) {
                const headers = parseCSVLine(lines[0]);
                data = lines.slice(1).map(line => {
                    const values = parseCSVLine(line);
                    return headers.reduce((acc: any, h, i) => {
                        acc[h] = values[i] || '';
                        return acc;
                    }, {});
                });
            }
        }

        if (data.length === 0) {
            return res.status(400).json({ error: 'No data to import' });
        }

        const errors: string[] = [];
        let imported = 0;

        for (const row of data) {
            try {
                const id = row.id || uuidv4();
                const now = new Date().toISOString();
                const { id: _, created_at, updated_at, collection: c, ...cleanData } = row;

                await db('neurofy_items').insert({
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
            } catch (err: any) {
                errors.push(`Row ${imported + errors.length + 1}: ${err.message}`);
            }
        }

        res.json({ success: true, imported, errors: errors.slice(0, 10) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
