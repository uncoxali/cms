import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/export — export data as CSV or JSON
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const collection = url.searchParams.get('collection');

    try {
        let items: any[];

        if (collection) {
            items = await db('neurofy_items').where('collection', collection).select('*');
        } else {
            items = await db('neurofy_items').select('*');
        }

        const data = items.map((item: any) => ({
            id: item.id,
            collection: item.collection,
            ...JSON.parse(item.data_json || '{}'),
            created_at: item.created_at,
            updated_at: item.updated_at,
        }));

        if (format === 'csv') {
            // Convert to CSV
            if (data.length === 0) {
                return new NextResponse('', {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="export_${Date.now()}.csv"`,
                    },
                });
            }

            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row =>
                    headers.map(h => {
                        const val = row[h];
                        if (val === null || val === undefined) return '';
                        const str = String(val);
                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    }).join(',')
                ),
            ];
            const csv = csvRows.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="export_${collection || 'all'}_${Date.now()}.csv"`,
                },
            });
        }

        // JSON format
        return new NextResponse(JSON.stringify(data, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="export_${collection || 'all'}_${Date.now()}.json"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
