import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

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

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const folder = url.searchParams.get('folder');
    const search = url.searchParams.get('search');
    const favorites = url.searchParams.get('favorites') === 'true';

    try {
        let query = db('directus_files').select('*');

        if (type && type !== 'all') query = query.where('type', type);
        if (folder) query = query.where('folder', folder);
        if (favorites) query = query.where('is_favorite', 1);

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
        const folders = await db('directus_folders').select('*');

        return NextResponse.json({
            data: files.map(normalizeFileRow),
            folders,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();

    try {
        await ensureUploadDir();

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const originalName = file.name || 'upload.bin';
        const ext = path.extname(originalName);
        const filenameDisk = `${id}${ext}`;

        const filePath = path.join(UPLOAD_DIR, filenameDisk);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        const folder = (formData.get('folder')?.toString() || null) as string | null;
        const title = (formData.get('title')?.toString() || null) as string | null;
        const description = (formData.get('description')?.toString() || null) as string | null;

        let tags: string[] = [];
        const tagsValue = formData.get('tags')?.toString();
        if (tagsValue) {
            try {
                const parsed = JSON.parse(tagsValue);
                if (Array.isArray(parsed)) tags = parsed.map((t) => String(t));
            } catch {
                tags = tagsValue
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
            }
        }

        const now = new Date().toISOString();

        await db('directus_files').insert({
            id,
            storage: 'local',
            filename_disk: filenameDisk,
            filename_download: originalName,
            title,
            type: inferFileType(file.type),
            mime_type: file.type || 'application/octet-stream',
            filesize: file.size || 0,
            description,
            tags_json: JSON.stringify(tags),
            folder,
            uploaded_by: auth.email,
            uploaded_on: now,
            modified_on: now,
            is_favorite: 0,
        });

        await db('directus_activity').insert({
            action: 'create',
            user: auth.email,
            user_id: auth.userId,
            collection: 'directus_files',
            item: id,
            meta_json: JSON.stringify({ filename: originalName, mime_type: file.type, filesize: file.size }),
        });

        const fileRecord = await db('directus_files').where('id', id).first();
        return NextResponse.json({ data: normalizeFileRow(fileRecord) }, { status: 201 });
    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
