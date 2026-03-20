import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';
import { runMigrations } from '@/lib/db/migrate';

type SEOConfig = {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    defaultOgImage: string;
    twitterHandle: string;
    enableAutoKeywords: boolean;
    enableAutoDescriptions: boolean;
    enableStructuredData: boolean;
    enableSitemap: boolean;
    enableRobotsTxt: boolean;
};

const DEFAULT_SEO_CONFIG: SEOConfig = {
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    defaultOgImage: '',
    twitterHandle: '',
    enableAutoKeywords: true,
    enableAutoDescriptions: true,
    enableStructuredData: true,
    enableSitemap: true,
    enableRobotsTxt: true,
};

function parseSeoJson(value: unknown): SEOConfig {
    if (!value) return DEFAULT_SEO_CONFIG;
    if (typeof value !== 'string') return DEFAULT_SEO_CONFIG;
    try {
        const parsed = JSON.parse(value) as Partial<SEOConfig>;
        return { ...DEFAULT_SEO_CONFIG, ...parsed };
    } catch {
        return DEFAULT_SEO_CONFIG;
    }
}

export async function GET(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    await runMigrations(db);

    let settings = await db('neurofy_settings').first();
    if (!settings) {
        await db('neurofy_settings').insert({ seo_json: JSON.stringify(DEFAULT_SEO_CONFIG) });
        settings = await db('neurofy_settings').first();
    }

    const seo = parseSeoJson(settings?.seo_json);
    return NextResponse.json({ data: seo });
}

export async function PATCH(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    await runMigrations(db);

    const body = (await request.json()) as Partial<SEOConfig>;
    const merged: SEOConfig = { ...DEFAULT_SEO_CONFIG, ...body };

    let settings = await db('neurofy_settings').first();
    if (!settings) {
        const [id] = await db('neurofy_settings').insert({
            seo_json: JSON.stringify(merged),
        });
        settings = await db('neurofy_settings').where('id', id).first();
    }

    const settingsId = settings?.id ?? 1;
    await db('neurofy_settings').where('id', settingsId).update({
        seo_json: JSON.stringify(merged),
    });

    await db('neurofy_activity').insert({
        action: 'update',
        user: check.auth.email,
        user_id: check.auth.userId,
        collection: 'neurofy_settings',
        item: 'seo',
        meta_json: JSON.stringify(body),
    });

    return NextResponse.json({ data: merged });
}

