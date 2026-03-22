"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = getFiles;
exports.getFile = getFile;
exports.uploadFile = uploadFile;
exports.updateFile = updateFile;
exports.deleteFile = deleteFile;
exports.viewFile = viewFile;
exports.migrateToDb = migrateToDb;
const database_1 = require("../config/database");
const config_1 = require("../config");
const date_1 = require("../utils/date");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = require("fs");
const UPLOAD_DIR = config_1.config.uploadDir;
async function ensureUploadDir() {
    await promises_1.default.mkdir(UPLOAD_DIR, { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(UPLOAD_DIR, 'tmp'), { recursive: true });
}
function inferFileType(mimeType) {
    const mt = (mimeType || '').toLowerCase();
    if (mt.startsWith('image/'))
        return 'image';
    if (mt.startsWith('video/'))
        return 'video';
    if (mt.startsWith('audio/'))
        return 'audio';
    if (mt === 'application/pdf' ||
        mt.includes('msword') ||
        mt.includes('officedocument') ||
        mt.startsWith('text/')) {
        return 'document';
    }
    if (mt.includes('zip') || mt.includes('tar') || mt.includes('gzip') || mt.includes('rar') || mt.includes('7z')) {
        return 'archive';
    }
    return 'other';
}
function normalizeFileRow(row) {
    if (!row)
        return row;
    return {
        ...row,
        tags: row.tags_json ? JSON.parse(row.tags_json) : [],
        tags_json: undefined,
        data: undefined, // Don't send binary data in json
    };
}
async function getFiles(req, res) {
    try {
        const type = req.query.type;
        const folder = req.query.folder;
        const search = req.query.search;
        const favorites = req.query.favorites === 'true';
        let query = (0, database_1.db)('neurofy_files').whereNull('deleted_at').select('*');
        if (type && type !== 'all')
            query = query.where('type', type);
        if (folder)
            query = query.where('folder', folder);
        if (favorites)
            query = query.where('is_favorite', 1);
        if (search) {
            const like = `%${search}%`;
            query = query.where((qb) => {
                qb.where('filename_download', 'like', like)
                    .orWhere('title', 'like', like)
                    .orWhere('description', 'like', like)
                    .orWhere('tags_json', 'like', like);
            });
        }
        const files = await query.orderBy('uploaded_on', 'desc');
        const folders = await (0, database_1.db)('neurofy_folders').select('*');
        res.json({
            data: files.map(normalizeFileRow),
            folders,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getFile(req, res) {
    try {
        const file = await (0, database_1.db)('neurofy_files').where('id', req.params.id).first();
        if (!file)
            return res.status(404).json({ error: 'File not found' });
        res.json({
            data: normalizeFileRow(file),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function uploadFile(req, res) {
    try {
        await ensureUploadDir();
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const id = require('crypto').randomUUID();
        const originalName = file.originalname || 'upload.bin';
        const ext = path_1.default.extname(originalName);
        const filenameDisk = `${id}${ext}`;
        const filePath = path_1.default.join(UPLOAD_DIR, filenameDisk);
        // Multer saved it to a temp path, move it
        await promises_1.default.rename(file.path, filePath);
        const folder = req.body.folder || null;
        const title = req.body.title || null;
        const description = req.body.description || null;
        let tags = [];
        const tagsValue = req.body.tags;
        if (tagsValue) {
            try {
                const parsed = JSON.parse(tagsValue);
                if (Array.isArray(parsed))
                    tags = parsed.map((t) => String(t));
            }
            catch {
                tags = tagsValue
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
            }
        }
        const now = (0, date_1.toDbDate)();
        // Read from final path — rename() already moved the file away from file.path
        const fileBuffer = await promises_1.default.readFile(filePath);
        await (0, database_1.db)('neurofy_files').insert({
            id,
            storage: 'database',
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
            data: fileBuffer,
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_files',
            item: id,
            meta_json: JSON.stringify({ filename: originalName, mime_type: file.mimetype, filesize: file.size }),
        });
        const fileRecord = await (0, database_1.db)('neurofy_files').where('id', id).first();
        res.json({ data: normalizeFileRow(fileRecord) });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateFile(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;
        const updateData = { modified_on: (0, date_1.toDbDate)() };
        if (body.title !== undefined)
            updateData.title = body.title;
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.folder !== undefined)
            updateData.folder = body.folder;
        if (body.is_favorite !== undefined)
            updateData.is_favorite = body.is_favorite;
        if (body.tags !== undefined)
            updateData.tags_json = JSON.stringify(body.tags);
        await (0, database_1.db)('neurofy_files').where('id', id).update(updateData);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteFile(req, res) {
    try {
        console.log('[deleteFile] id:', req.params.id);
        const { id } = req.params;
        const file = await (0, database_1.db)('neurofy_files').where('id', id).first();
        console.log('[deleteFile] file:', file);
        if (!file)
            return res.status(404).json({ error: 'File not found' });
        // Table is ensured in database.ts
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const { data, ...fileWithoutData } = file;
        await (0, database_1.db)('neurofy_trash').insert({
            item_id: id,
            collection: 'neurofy_files',
            data_json: JSON.stringify({
                ...fileWithoutData,
                tags: file.tags_json ? JSON.parse(file.tags_json) : [],
                tags_json: undefined,
                _collection_label: 'Files',
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: (0, date_1.toDbDate)(),
            expires_at: (0, date_1.toDbDate)(expiresAt),
        });
        // Soft delete: set deleted_at timestamp
        await (0, database_1.db)('neurofy_files').where('id', id).update({ deleted_at: (0, date_1.toDbDate)() });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_files',
            item: id,
            meta_json: JSON.stringify({ filename: file.filename_download, _action: 'moved_to_trash' }),
        });
        res.json({ success: true, movedToTrash: true });
    }
    catch (error) {
        console.error('[deleteFile] error:', error);
        res.status(500).json({ error: error.message });
    }
}
async function viewFile(req, res) {
    try {
        const { id } = req.params;
        const file = await (0, database_1.db)('neurofy_files').where('id', id).first();
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        // 1. Try serving from Database (BLOB)
        if (file.data) {
            res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            return res.send(file.data);
        }
        // 2. Fallback to Disk
        const diskPath = path_1.default.isAbsolute(file.filename_disk)
            ? file.filename_disk
            : path_1.default.join(config_1.config.uploadDir, file.filename_disk);
        if ((0, fs_1.existsSync)(diskPath)) {
            return res.sendFile(diskPath);
        }
        // 3. Try legacy public directory path
        const publicPath = path_1.default.join(process.cwd(), '..', 'public', 'uploads', path_1.default.basename(file.filename_disk));
        if ((0, fs_1.existsSync)(publicPath)) {
            return res.sendFile(publicPath);
        }
        // 4. Try remote server fallback (for local development)
        // If we are in development and the database is remote, redirect to the remote server's uploads folder
        if (config_1.config.nodeEnv !== 'production' && config_1.config.dbHost !== 'localhost' && config_1.config.dbHost !== '127.0.0.1') {
            const remoteUrl = `http://${config_1.config.dbHost}:${config_1.config.port}/uploads/${file.filename_disk}`;
            return res.redirect(remoteUrl);
        }
        res.status(404).json({ error: 'File content not found (DB or Disk)' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function migrateToDb(req, res) {
    try {
        const filesInDb = await (0, database_1.db)('neurofy_files').where({ storage: 'local' }).orWhereNull('data');
        let count = 0;
        for (const file of filesInDb) {
            const filePath = path_1.default.join(config_1.config.uploadDir, file.filename_disk);
            if ((0, fs_1.existsSync)(filePath)) {
                const buffer = await promises_1.default.readFile(filePath);
                await (0, database_1.db)('neurofy_files').where('id', file.id).update({
                    data: buffer,
                    storage: 'database'
                });
                count++;
            }
        }
        res.json({ success: true, migrated_count: count });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=files.controller.js.map