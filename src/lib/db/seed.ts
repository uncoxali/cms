import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { collections } from '@/lib/meta/collections';

export async function seed(db: Knex) {
    // Seed only if no roles exist
    const existingRoles = await db('neurofy_roles').select('id');
    if (existingRoles.length > 0) {
        console.log('[DB] Seed skipped — data already exists');
        // Still ensure content tables exist even if seed was already run
        await ensureContentTables(db);
        return;
    }

    // ---- Roles ----
    await db('neurofy_roles').insert([
        {
            id: 'role_admin',
            name: 'Administrator',
            description: 'Full system access with no restrictions.',
            admin_access: true,
            app_access: true,
            icon: 'shield',
            permissions_json: JSON.stringify({ _all: { create: true, read: true, update: true, delete: true } }),
        },
        {
            id: 'role_editor',
            name: 'Editor',
            description: 'Can manage content but not system settings.',
            admin_access: false,
            app_access: true,
            icon: 'edit',
            permissions_json: JSON.stringify({
                _all: { create: true, read: true, update: true, delete: false },
            }),
        },
        {
            id: 'role_viewer',
            name: 'Viewer',
            description: 'Read-only access to all content.',
            admin_access: false,
            app_access: true,
            icon: 'eye',
            permissions_json: JSON.stringify({
                _all: { create: false, read: true, update: false, delete: false },
            }),
        },
    ]);

    // ---- Users ----
    const adminHash = await bcrypt.hash('admin123', 10);
    const editorHash = await bcrypt.hash('editor123', 10);
    const viewerHash = await bcrypt.hash('viewer123', 10);

    await db('neurofy_users').insert([
        {
            id: 'user_admin',
            email: 'admin@example.com',
            password_hash: adminHash,
            first_name: 'Admin',
            last_name: 'User',
            role: 'role_admin',
            status: 'active',
        },
        {
            id: 'user_editor',
            email: 'editor@example.com',
            password_hash: editorHash,
            first_name: 'Editor',
            last_name: 'User',
            role: 'role_editor',
            status: 'active',
        },
        {
            id: 'user_viewer',
            email: 'viewer@example.com',
            password_hash: viewerHash,
            first_name: 'Viewer',
            last_name: 'User',
            role: 'role_viewer',
            status: 'active',
        },
    ]);

    // ---- Settings ----
    await db('neurofy_settings').insert({
        project_name: 'NexDirect',
        project_description: 'A modern headless CMS',
        project_color: '#6644ff',
        default_locale: 'en-US',
        default_timezone: 'UTC',
        theme: 'dark',
        default_font: 'Inter',
        default_page_size: 25,
        feature_flags_json: JSON.stringify({
            insights: true,
            files: true,
            flows: true,
            activity: true,
            extensions: true,
        }),
    });

    // ---- Default Folders ----
    await db('neurofy_folders').insert([
        { id: 'folder_root', name: 'All Files', parent: null },
        { id: 'folder_images', name: 'Images', parent: 'folder_root' },
        { id: 'folder_documents', name: 'Documents', parent: 'folder_root' },
        { id: 'folder_videos', name: 'Videos', parent: 'folder_root' },
    ]);

    // ---- Create content tables ----
    await ensureContentTables(db);

    // ---- Activity log for seed ----
    await db('neurofy_activity').insert({
        action: 'login',
        user: 'Admin User',
        user_id: 'user_admin',
        collection: null,
        item: null,
        meta_json: JSON.stringify({ source: 'seed' }),
    });

    console.log('[DB] Seed complete — 3 roles, 3 users, settings, folders, content tables');
}

function mapFieldTypeToSqlite(type: string): string {
    switch (type) {
        case 'number': case 'integer': case 'float': return 'number';
        case 'boolean': return 'boolean';
        case 'textarea': case 'rich-text': case 'text': return 'text';
        case 'datetime': return 'datetime';
        default: return 'string';
    }
}

async function ensureContentTables(db: Knex) {
    for (const [key, config] of Object.entries(collections)) {
        const exists = await db.schema.hasTable(key);
        if (exists) continue;

        await db.schema.createTable(key, (t) => {
            t.increments('id').primary();

            for (const field of config.fields) {
                if (field.name === 'id') continue;
                if (field.group === 'Meta' && field.name !== 'id') continue;

                const sqlType = mapFieldTypeToSqlite(field.type);
                let col;
                switch (sqlType) {
                    case 'number': col = t.float(field.name); break;
                    case 'boolean': col = t.boolean(field.name); break;
                    case 'text': col = t.text(field.name); break;
                    case 'datetime': col = t.timestamp(field.name); break;
                    default: col = t.string(field.name); break;
                }
                if (field.required) col.notNullable();
                else col.nullable();
            }

            t.timestamp('date_created').defaultTo(db.fn.now());
            t.timestamp('date_updated').defaultTo(db.fn.now());
        });

        // Save metadata
        const metaExists = await db('neurofy_collections_meta').where('collection', key).first();
        if (!metaExists) {
            await db('neurofy_collections_meta').insert({
                collection: key,
                label: config.label,
                icon: config.icon || 'database',
            });
        }

        console.log(`[DB] Created content table: ${key} (${config.fields.length} fields)`);
    }
}
