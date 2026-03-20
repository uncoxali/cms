import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    try {
        const webhooks = await db('neurofy_webhooks')
            .select('*')
            .orderBy('created_at', 'desc');
        
        return NextResponse.json({
            data: webhooks.map(w => ({
                id: w.id,
                name: w.name,
                method: w.method || 'POST',
                url: w.url,
                status: w.status || 'active',
                collections: w.collections_json ? JSON.parse(w.collections_json) : [],
                events: w.events_json ? JSON.parse(w.events_json) : [],
                headers: w.headers_json ? JSON.parse(w.headers_json) : [],
                auth: w.auth_json ? JSON.parse(w.auth_json) : { type: 'none' },
                last_triggered: w.last_triggered,
                success_rate: w.success_rate || 100,
                date_created: w.created_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching webhooks:', error);
        return NextResponse.json({ data: [] });
    }
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const db = getDb();
    
    try {
        const body = await request.json();
        const { name, method, url, collections, events, headers, auth: authData, status } = body;

        if (!name || !url) {
            return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
        }

        const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db('neurofy_webhooks').insert({
            id,
            name,
            method: method || 'POST',
            url,
            collections_json: JSON.stringify(collections || []),
            events_json: JSON.stringify(events || []),
            headers_json: JSON.stringify(headers || []),
            auth_json: JSON.stringify(authData || { type: 'none' }),
            status: status || 'active',
            success_rate: 100,
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({
            data: {
                id,
                name,
                method: method || 'POST',
                url,
                collections: collections || [],
                events: events || [],
                headers: headers || [],
                auth: authData || { type: 'none' },
                status: status || 'active',
                successRate: 100,
                dateCreated: new Date().toISOString(),
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating webhook:', error);
        return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }
}
