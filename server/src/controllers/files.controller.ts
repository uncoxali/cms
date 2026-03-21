import { Response } from 'express';
import { db } from '../config/database';
import { config } from '../config';
import { AuthenticatedRequest } from '../utils/auth';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const UPLOAD_DIR = config.uploadDir;

async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

function inferFileType(mimeType: string | null | undefined): string {
    const mt = (mimeType || '').toLowerCase();
    if (mt.startsWith('image/')) return 'image';
    if (mt.startsWith('video/')) return 'video';
    if (mt.startsWith('audio/')) return 'audio';
    if (
        mt === 'application/pdf' ||
        mt.includes('msword') ||
        mt.includes('officedocument') ||
        mt.startsWith('text/')
    ) {
        return 'document';
    }
    if (mt.includes('zip') || mt.includes('tar') || mt.includes('gzip') || mt.includes('rar') || mt.includes('7z')) {
        return 'archive';
    }
    return 'other';
}

function normalizeFileRow(row: any) {
    if (!row) return row;
    return {
        ...row,
        tags: row.tags_json ? JSON.parse(row.tags_json) : [],
        tags_json: undefined,
    };
}

export async function getFiles(req: AuthenticatedRequest, res: Response) {
    try {
        const type = req.query.type as string;
        const folder = req.query.folder as string;
        const search = req.query.search as string;
        const favorites = req.query.favorites === 'true';

        let query = db('neurofy_files').select('*');

        if (type && type !== 'all') query = query.where('type', type);
        if (folder) query = query.where('folder', folder);
        if (favorites) query = query.where('is_favorite', 1);

        if (search) {
            const like = `%${search}%`;
            query = query.where((qb: any) => {
                qb.where('filename_download', 'like', like)
                    .orWhere('title', 'like', like)
                    .orWhere('description', 'like', like)
                    .orWhere('tags_json', 'like', like);
            });
        }

        const files = await query.orderBy('uploaded_on', 'desc');
        const folders = await db('neurofy_folders').select('*');

        res.json({
            data: files.map(normalizeFileRow),
            folders,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getFile(req: AuthenticatedRequest, res: Response) {
    try {
        const file = await db('neurofy_files').where('id', req.params.id).first();
        if (!file) return res.status(404).json({ error: 'File not found' });

        res.json({
            data: normalizeFileRow(file),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function uploadFile(req: AuthenticatedRequest, res: Response) {
    try {
        await ensureUploadDir();

        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const id = require('crypto').randomUUID();
        const originalName = file.originalname || 'upload.bin';
        const ext = path.extname(originalName);
        const filenameDisk = `${id}${ext}`;

        const filePath = path.join(UPLOAD_DIR, filenameDisk);
        
        // Multer saved it to a temp path, move it
        await fs.rename(file.path, filePath);

        const folder = req.body.folder || null;
        const title = req.body.title || null;
        const description = req.body.description || null;

        let tags: string[] = [];
        const tagsValue = req.body.tags;
        if (tagsValue) {
            try {
                const parsed = JSON.parse(tagsValue);
                if (Array.isArray(parsed)) tags = parsed.map((t: any) => String(t));
            } catch {
                tags = tagsValue
                    .split(',')
                    .map((t: string) => t.trim())
                    .filter(Boolean);
            }
        }

        const now = new Date().toISOString();

        await db('neurofy_files').insert({
            id,
            storage: 'local',
            filename_disk: filenameDisk,
            filename_download: originalName,
            title,
            type: inferFileType(file.mimetype),
            mime_type: file.mimetype || 'application/octet-stream',
            filesize: file.size || 0,
            description,
            tags_json: JSON.stringify(tags),
            folder,
            uploaded_by: req.auth?.email || 'system',
            uploaded_on: now,
            modified_on: now,
            is_favorite: 0,
        });

        await db('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_files',
            item: id,
            meta_json: JSON.stringify({ filename: originalName, mime_type: file.mimetype, filesize: file.size }),
        });

        const fileRecord = await db('neurofy_files').where('id', id).first();
        res.json({ data: normalizeFileRow(fileRecord) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateFile(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;
        const body = req.body;

        const updateData: any = { modified_on: new Date().toISOString() };
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.folder !== undefined) updateData.folder = body.folder;
        if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite;
        if (body.tags !== undefined) updateData.tags_json = JSON.stringify(body.tags);

        await db('neurofy_files').where('id', id).update(updateData);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
        const { id } = req.params;

        const file = await db('neurofy_files').where('id', id).first();
        if (!file) return res.status(404).json({ error: 'File not found' });

        const hasTrashTable = await db.schema.hasTable('neurofy_trash');
        if (!hasTrashTable) {
            await db.schema.createTable('neurofy_trash', (table: any) => {
                table.increments('trash_id').primary();
                table.string('item_id').notNullable();
                table.string('collection').notNullable();
                table.text('data_json').notNullable();
                table.string('deleted_by');
                table.timestamp('deleted_at').defaultTo(db.fn.now());
                table.timestamp('expires_at');
            });
            await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await db('neurofy_trash').insert({
            item_id: id,
            collection: 'neurofy_files',
            data_json: JSON.stringify({
                ...file,
                tags: file.tags_json ? JSON.parse(file.tags_json) : [],
                tags_json: undefined,
                _collection_label: 'Files',
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
        });

        await db('neurofy_files').where('id', id).delete();

        await db('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_files',
            item: id,
            meta_json: JSON.stringify({ filename: file.filename_download, _action: 'moved_to_trash' }),
        });

        res.json({ success: true, movedToTrash: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
