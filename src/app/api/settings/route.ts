import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

// GET /api/settings (admin only)
export async function GET(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    const settings = await db('neurofy_settings').first();

    if (!settings) return NextResponse.json({ data: null });

    return NextResponse.json({
        data: {
            ...settings,
            feature_flags: settings.feature_flags_json ? JSON.parse(settings.feature_flags_json) : {},
            feature_flags_json: undefined,
        },
    });
}

// PATCH /api/settings (admin only)
export async function PATCH(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    const body = await request.json();

    const updateData: any = { ...body };
    if (body.feature_flags) {
        updateData.feature_flags_json = JSON.stringify(body.feature_flags);
        delete updateData.feature_flags;
    }

    await db('neurofy_settings').where('id', 1).update(updateData);

    await db('neurofy_activity').insert({
        action: 'update', user: check.auth.email, user_id: check.auth.userId,
        collection: 'neurofy_settings', item: '1',
        meta_json: JSON.stringify(body),
    });

    const settings = await db('neurofy_settings').first();
    return NextResponse.json({
        data: {
            ...settings,
            feature_flags: settings.feature_flags_json ? JSON.parse(settings.feature_flags_json) : {},
            feature_flags_json: undefined,
        },
    });
}
