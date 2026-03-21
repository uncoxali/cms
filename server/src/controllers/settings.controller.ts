import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

export async function getSettings(req: AuthenticatedRequest, res: Response) {
    try {
        const settings = await db('neurofy_settings').first();

        if (!settings) return res.json({ data: null });

        res.json({
            data: {
                ...settings,
                feature_flags: settings.feature_flags_json ? JSON.parse(settings.feature_flags_json) : {},
                feature_flags_json: undefined,
                custom_themes: settings.custom_themes_json ? JSON.parse(settings.custom_themes_json) : [],
                custom_themes_json: undefined,
                logo_settings: settings.logo_settings_json ? JSON.parse(settings.logo_settings_json) : null,
                logo_settings_json: undefined,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
        const body = req.body;

        const updateData: any = { ...body };
        if (body.feature_flags) {
            updateData.feature_flags_json = JSON.stringify(body.feature_flags);
            delete updateData.feature_flags;
        }
        if (body.custom_themes !== undefined) {
            updateData.custom_themes_json = JSON.stringify(body.custom_themes);
            delete updateData.custom_themes;
        }
        if (body.logo_settings !== undefined) {
            updateData.logo_settings_json = JSON.stringify(body.logo_settings);
            delete updateData.logo_settings;
        }

        await db('neurofy_settings').where('id', 1).update(updateData);

        await db('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_settings',
            item: '1',
            meta_json: JSON.stringify(body),
        });

        const settings = await db('neurofy_settings').first();
        res.json({
            data: {
                ...settings,
                feature_flags: settings.feature_flags_json ? JSON.parse(settings.feature_flags_json) : {},
                feature_flags_json: undefined,
                custom_themes: settings.custom_themes_json ? JSON.parse(settings.custom_themes_json) : [],
                custom_themes_json: undefined,
                logo_settings: settings.logo_settings_json ? JSON.parse(settings.logo_settings_json) : null,
                logo_settings_json: undefined,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getSeoSettings(req: AuthenticatedRequest, res: Response) {
    try {
        const settings = await db('neurofy_settings').first();
        const seo = settings?.seo_json ? JSON.parse(settings.seo_json) : {};
        res.json({ data: seo });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateSeoSettings(req: AuthenticatedRequest, res: Response) {
    try {
        const seoData = req.body;

        await db('neurofy_settings').where('id', 1).update({
            seo_json: JSON.stringify(seoData),
        });

        await db('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_settings',
            item: '1',
            meta_json: JSON.stringify({ type: 'seo_settings' }),
        });

        res.json({ data: seoData });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
