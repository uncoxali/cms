import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/settings
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const settings = await db('directus_settings').first();

    if (!settings) return NextResponse.json({ data: null });

    return NextResponse.json({
        data: {
            ...settings,
            feature_flags: settings.feature_flags_json ? JSON.parse(settings.feature_flags_json) : {},
            feature_flags_json: undefined,
        },
    });
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const db = getDb();
    const body = await request.json();

    const updateData: any = { ...body };
    if (body.feature_flags) {
        updateData.feature_flags_json = JSON.stringify(body.feature_flags);
        delete updateData.feature_flags;
    }

    await db('directus_settings').where('id', 1).update(updateData);

    await db('directus_activity').insert({
        action: 'update', user: auth.email, user_id: auth.userId,
        collection: 'directus_settings', item: '1',
        meta_json: JSON.stringify(body),
    });

    const settings = await db('directus_settings').first();
    return NextResponse.json({
        data: {
            ...settings,
            feature_flags: settings.feature_flags_json ? JSON.parse(settings.feature_flags_json) : {},
            feature_flags_json: undefined,
        },
    });
}
