"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.getSeoSettings = getSeoSettings;
exports.updateSeoSettings = updateSeoSettings;
const database_1 = require("../config/database");
async function getSettings(req, res) {
    try {
        const settings = await (0, database_1.db)('neurofy_settings').first();
        if (!settings)
            return res.json({ data: null });
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateSettings(req, res) {
    try {
        const body = req.body;
        const updateData = { ...body };
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
        await (0, database_1.db)('neurofy_settings').where('id', 1).update(updateData);
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_settings',
            item: '1',
            meta_json: JSON.stringify(body),
        });
        const settings = await (0, database_1.db)('neurofy_settings').first();
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getSeoSettings(req, res) {
    try {
        const settings = await (0, database_1.db)('neurofy_settings').first();
        const seo = settings?.seo_json ? JSON.parse(settings.seo_json) : {};
        res.json({ data: seo });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateSeoSettings(req, res) {
    try {
        const seoData = req.body;
        await (0, database_1.db)('neurofy_settings').where('id', 1).update({
            seo_json: JSON.stringify(seoData),
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_settings',
            item: '1',
            meta_json: JSON.stringify({ type: 'seo_settings' }),
        });
        res.json({ data: seoData });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=settings.controller.js.map