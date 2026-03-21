import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// POST /api/import — import data from CSV or JSON
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const collection = formData.get('collection') as string;

    if (!file || !collection) {
        return NextResponse.json({ error: 'File and collection are required' }, { status: 400 });
    }

    try {
        const text = await file.text();
        let data: any[] = [];

        if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            data = Array.isArray(parsed) ? parsed : [parsed];
        } else {
            // Parse CSV
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
            return NextResponse.json({ error: 'No data to import' }, { status: 400 });
        }

        const errors: string[] = [];
        let imported = 0;

        for (const row of data) {
            try {
                const id = row.id || uuidv4();
                const now = new Date().toISOString();

                // Remove system fields from data
                const { id: _, created_at, updated_at, collection: c, ...cleanData } = row;

                await db('neurofy_items').insert({
                    id,
                    collection,
                    data_json: JSON.stringify(cleanData),
                    created_at: created_at || now,
                    updated_at: updated_at || now,
                    created_by: auth.email,
                }).onConflict('id').merge({
                    data_json: JSON.stringify(cleanData),
                    updated_at: now,
                });

                imported++;
            } catch (err: any) {
                errors.push(`Row ${imported + errors.length + 1}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            errors: errors.slice(0, 10),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
