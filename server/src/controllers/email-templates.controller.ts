import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

// GET /api/email-templates
export async function getEmailTemplates(req: AuthenticatedRequest, res: Response) {
    try {
        const templates = await db('email_templates').select('*').orderBy('date_created', 'desc');
        res.json({
            data: templates.map(t => ({
                id: t.id,
                name: t.name,
                subject: t.subject,
                body: t.body,
                type: t.type,
                to: t.to_field,
                from: t.from_field,
                cc: t.cc,
                bcc: t.bcc,
                active: !!t.active,
                lastSent: t.last_sent,
                sentCount: t.sent_count || 0,
                dateCreated: t.date_created,
            })),
        });
    } catch (error: any) {
        if (error.message?.includes('no such table')) {
            return res.json({ data: [] });
        }
        res.status(500).json({ error: error.message });
    }
}

// GET /api/email-templates/:id
export async function getEmailTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const template = await db('email_templates').where({ id }).first();
        if (!template) return res.status(404).json({ error: 'Template not found' });

        res.json({
            data: {
                id: template.id,
                name: template.name,
                subject: template.subject,
                body: template.body,
                type: template.type,
                to: template.to_field,
                from: template.from_field,
                cc: template.cc,
                bcc: template.bcc,
                active: !!template.active,
                lastSent: template.last_sent,
                sentCount: template.sent_count || 0,
                dateCreated: template.date_created,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/email-templates
export async function createEmailTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const { name, subject, body: emailBody, type, to, from, cc, bcc, active } = req.body;

        if (!name || !subject) {
            return res.status(400).json({ error: 'Name and subject are required' });
        }

        const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db('email_templates').insert({
            id,
            name,
            subject,
            body: emailBody || '',
            type: type || 'custom',
            to_field: to || '',
            from_field: from || '',
            cc: cc || '',
            bcc: bcc || '',
            active: active !== false ? 1 : 0,
            sent_count: 0,
            date_created: new Date().toISOString(),
        });

        res.status(201).json({
            data: {
                id, name, subject, body: emailBody,
                type: type || 'custom', to, from,
                active: active !== false, sentCount: 0,
                dateCreated: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        if (error.message?.includes('no such table')) {
            try {
                await db.schema.createTable('email_templates', (table) => {
                    table.string('id').primary();
                    table.string('name').notNullable();
                    table.string('subject').notNullable();
                    table.text('body');
                    table.string('type').defaultTo('custom');
                    table.string('to_field');
                    table.string('from_field');
                    table.string('cc');
                    table.string('bcc');
                    table.integer('active').defaultTo(1);
                    table.integer('sent_count').defaultTo(0);
                    table.string('last_sent');
                    table.string('date_created');
                    table.string('date_updated');
                });
                return res.status(201).json({ data: { id: 'retry', ...req.body } });
            } catch (createError) {
                return res.status(500).json({ error: String(createError) });
            }
        }
        res.status(500).json({ error: error.message });
    }
}

// PATCH /api/email-templates/:id
export async function updateEmailTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const { name, subject, body: emailBody, type, to, from, cc, bcc, active } = req.body;

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (subject !== undefined) updateData.subject = subject;
        if (emailBody !== undefined) updateData.body = emailBody;
        if (type !== undefined) updateData.type = type;
        if (to !== undefined) updateData.to_field = to;
        if (from !== undefined) updateData.from_field = from;
        if (cc !== undefined) updateData.cc = cc;
        if (bcc !== undefined) updateData.bcc = bcc;
        if (active !== undefined) updateData.active = active ? 1 : 0;
        updateData.date_updated = new Date().toISOString();

        await db('email_templates').where({ id }).update(updateData);
        const updated = await db('email_templates').where({ id }).first();

        res.json({
            data: {
                id: updated.id,
                name: updated.name,
                subject: updated.subject,
                body: updated.body,
                type: updated.type,
                to: updated.to_field,
                from: updated.from_field,
                active: !!updated.active,
                dateCreated: updated.date_created,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// DELETE /api/email-templates/:id
export async function deleteEmailTemplate(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        await db('email_templates').where({ id }).delete();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
