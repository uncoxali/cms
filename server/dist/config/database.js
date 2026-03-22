"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
const knex_1 = __importDefault(require("knex"));
const index_1 = require("./index");
const db = (0, knex_1.default)({
    client: index_1.config.dbClient === 'mysql' || index_1.config.dbClient === 'mysql2' ? 'mysql2' : 'better-sqlite3',
    connection: index_1.config.dbClient === 'mysql' || index_1.config.dbClient === 'mysql2'
        ? {
            host: index_1.config.dbHost,
            user: index_1.config.dbUser,
            password: index_1.config.dbPassword,
            database: index_1.config.dbName,
        }
        : {
            filename: index_1.config.dbPath,
        },
    useNullAsDefault: true,
});
exports.db = db;
async function initializeDatabase() {
    try {
        await db.raw('SELECT 1');
        console.log('✅ Database connected. Client:', db.client.config.client);
        console.log('📂 Database path (if SQLite):', index_1.config.dbPath);
        // Ensure required tables exist
        await ensureTables();
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
async function ensureTables() {
    // 1. neurofy_roles
    const hasRolesTable = await db.schema.hasTable('neurofy_roles');
    if (!hasRolesTable) {
        await db.schema.createTable('neurofy_roles', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.text('description');
            table.boolean('admin_access').defaultTo(false);
            table.boolean('app_access').defaultTo(true);
            table.string('icon').defaultTo('supervised_user_circle');
            table.text('permissions_json').defaultTo('{}');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
        // Seed initial roles
        await db('neurofy_roles').insert([
            {
                id: 'role_admin',
                name: 'Administrator',
                description: 'Full system access with no restrictions.',
                admin_access: true,
                app_access: true,
                icon: 'shield',
                permissions_json: JSON.stringify({ _all: { create: true, read: true, update: true, delete: true } })
            },
            {
                id: 'role_editor',
                name: 'Editor',
                description: 'Can manage content but not system settings.',
                admin_access: true,
                app_access: true,
                icon: 'edit',
                permissions_json: JSON.stringify([{ collection: 'brands', create: 'none', read: 'none', update: 'full', delete: 'full', share: 'full' }])
            },
            {
                id: 'role_viewer',
                name: 'Viewer',
                description: 'Read-only access to all content.',
                admin_access: false,
                app_access: true,
                icon: 'eye',
                permissions_json: JSON.stringify({ collections: [], _modules: { dashboard: true, content: false, pages: true, files: true, users: false, flows: false, settings: false, activity: false }, _api: { items: true, files: true, pages: true, schema: true, flows: true, users: true, roles: true, activity: true, dashboard: true, relations: true }, _pages: { "4": true } })
            }
        ]);
    }
    // 2. neurofy_users
    const hasUsersTable = await db.schema.hasTable('neurofy_users');
    if (!hasUsersTable) {
        await db.schema.createTable('neurofy_users', (table) => {
            table.string('id').primary();
            table.string('email').notNullable().unique();
            table.string('password_hash').notNullable();
            table.string('first_name');
            table.string('last_name');
            table.string('role').references('id').inTable('neurofy_roles').onDelete('SET NULL');
            table.string('status').defaultTo('active');
            table.string('avatar');
            table.text('description');
            table.timestamp('last_access');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
        // Seed initial users
        await db('neurofy_users').insert([
            {
                id: 'admin',
                email: 'admin@example.com',
                password_hash: '$2b$10$idaNQqq2d.XjlLP.Gwncb.dYXdRoWDrMkJ2G8PZhckThuAsVWqf6O', // password: admin
                first_name: 'Admin',
                last_name: 'User',
                role: 'role_admin',
                status: 'active'
            },
            {
                id: 'editor',
                email: 'editor@example.com',
                password_hash: '$2b$10$T7NqJrk13GwHDoKKxxA.ueKb8QFHbMgykugYlBrv.Gjp37S08np1O', // password: editor
                first_name: 'Editor',
                last_name: 'User',
                role: 'role_editor',
                status: 'active'
            },
            {
                id: 'viewer',
                email: 'viewer@example.com',
                password_hash: '$2b$10$c5zHtSvFKc86slLhONhxo.Sge7CuLuwDuMvhxu8UlMFAzzk3XlRD6', // password: viewer
                first_name: 'Viewer',
                last_name: 'User',
                role: 'role_viewer',
                status: 'active'
            }
        ]);
    }
    // 3. neurofy_settings
    const hasSettingsTable = await db.schema.hasTable('neurofy_settings');
    if (!hasSettingsTable) {
        await db.schema.createTable('neurofy_settings', (table) => {
            table.increments('id').primary();
            table.string('project_name').defaultTo('NexDirect');
            table.text('project_description');
            table.string('project_color').defaultTo('#6644ff');
            table.string('project_logo');
            table.string('default_locale').defaultTo('en-US');
            table.string('default_timezone').defaultTo('UTC');
            table.string('theme').defaultTo('dark');
            table.string('default_font').defaultTo('Inter');
            table.integer('default_page_size').defaultTo(25);
            table.string('default_sort_field').defaultTo('id');
            table.string('default_sort_order').defaultTo('asc');
            table.string('date_format').defaultTo('YYYY-MM-DD');
            table.string('number_format').defaultTo('comma');
            table.text('feature_flags_json').defaultTo('{}');
            table.string('theme_preset').defaultTo('midnight');
            table.text('custom_themes_json');
            table.text('seo_json');
            table.integer('token_expiration').defaultTo(168);
            table.integer('token_refresh_interval').defaultTo(12);
        });
        await db('neurofy_settings').insert({ project_name: 'NexDirect' });
    }
    else {
        // Compatibility checks for existing settings table
        if (!(await db.schema.hasColumn('neurofy_settings', 'token_expiration'))) {
            await db.schema.alterTable('neurofy_settings', (table) => {
                table.integer('token_expiration').defaultTo(168);
            });
        }
        if (!(await db.schema.hasColumn('neurofy_settings', 'token_refresh_interval'))) {
            await db.schema.alterTable('neurofy_settings', (table) => {
                table.integer('token_refresh_interval').defaultTo(12);
            });
        }
        if (!(await db.schema.hasColumn('neurofy_settings', 'logo_settings_json'))) {
            await db.schema.alterTable('neurofy_settings', (table) => {
                table.text('logo_settings_json');
            });
        }
    }
    // 4. neurofy_trash
    const hasTrashTable = await db.schema.hasTable('neurofy_trash');
    if (!hasTrashTable) {
        await db.schema.createTable('neurofy_trash', (table) => {
            table.increments('trash_id').primary();
            table.string('item_id').notNullable();
            table.string('collection').notNullable();
            table.text('data_json', 'longtext').notNullable();
            table.string('deleted_by');
            table.timestamp('deleted_at').defaultTo(db.fn.now());
            table.timestamp('expires_at');
        });
        if (db.client.config.client !== 'mysql2') {
            await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
        }
        else {
            await db.schema.alterTable('neurofy_trash', (table) => {
                table.unique(['item_id', 'collection'], { indexName: 'idx_trash_item' });
            });
        }
    }
    else {
        // Ensure data_json column is LONGTEXT for MySQL to handle large JSON data
        if (db.client.config.client === 'mysql2') {
            await db.schema.alterTable('neurofy_trash', (table) => {
                table.text('data_json', 'longtext').alter();
            });
        }
    }
    // 5. neurofy_templates
    const hasTemplatesTable = await db.schema.hasTable('neurofy_templates');
    if (!hasTemplatesTable) {
        await db.schema.createTable('neurofy_templates', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.text('description');
            table.string('collection').notNullable();
            table.text('data_json').notNullable();
            table.string('category').defaultTo('general');
            table.string('created_by');
            table.timestamp('created_at').defaultTo(db.fn.now());
            table.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }
    // 6. neurofy_relations
    const hasRelationsTable = await db.schema.hasTable('neurofy_relations');
    if (!hasRelationsTable) {
        await db.schema.createTable('neurofy_relations', (table) => {
            table.increments('id').primary();
            table.string('collection').notNullable();
            table.string('field').notNullable();
            table.string('related_collection').notNullable();
            table.string('related_field').defaultTo('id');
            table.string('display_field').defaultTo('id');
            table.string('on_delete').defaultTo('SET NULL');
            table.boolean('required').defaultTo(false);
        });
    }
    // 7. neurofy_collections_meta
    const hasMetaTable = await db.schema.hasTable('neurofy_collections_meta');
    if (!hasMetaTable) {
        await db.schema.createTable('neurofy_collections_meta', (table) => {
            table.string('collection').primary();
            table.string('label');
            table.string('icon');
            table.text('description');
            table.boolean('hidden').defaultTo(false);
            table.string('sort_field');
            table.text('searchable_fields_json').defaultTo('[]');
        });
    }
    // 8. neurofy_activity
    const hasActivityTable = await db.schema.hasTable('neurofy_activity');
    if (!hasActivityTable) {
        await db.schema.createTable('neurofy_activity', (table) => {
            table.increments('id').primary();
            table.string('action').notNullable();
            table.string('user');
            table.string('user_id');
            table.timestamp('timestamp').defaultTo(db.fn.now());
            table.string('ip');
            table.string('user_agent');
            table.string('collection');
            table.string('item');
            table.text('comment');
            table.text('meta_json');
        });
    }
    // 9. neurofy_folders
    const hasFoldersTable = await db.schema.hasTable('neurofy_folders');
    if (!hasFoldersTable) {
        await db.schema.createTable('neurofy_folders', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.string('parent_id').references('id').inTable('neurofy_folders').onDelete('CASCADE');
            table.string('created_by');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }
    // 10. neurofy_files
    const hasFilesTable = await db.schema.hasTable('neurofy_files');
    if (!hasFilesTable) {
        await db.schema.createTable('neurofy_files', (table) => {
            table.string('id').primary();
            table.string('storage').defaultTo('local');
            table.string('filename_disk').notNullable();
            table.string('filename_download').notNullable();
            table.string('title');
            table.string('type');
            table.string('mime_type');
            table.integer('filesize').defaultTo(0);
            table.text('description');
            table.text('tags_json').defaultTo('[]');
            table.string('folder').references('id').inTable('neurofy_folders').onDelete('SET NULL');
            table.string('uploaded_by');
            table.timestamp('uploaded_on').defaultTo(db.fn.now());
            table.timestamp('modified_on').defaultTo(db.fn.now());
            table.boolean('is_favorite').defaultTo(false);
            table.timestamp('deleted_at');
            table.specificType('data', db.client.config.client === 'mysql2' ? 'LONGBLOB' : 'BLOB');
        });
    }
    else {
        // Compatibility check for data column
        if (!(await db.schema.hasColumn('neurofy_files', 'data'))) {
            await db.schema.alterTable('neurofy_files', (table) => {
                table.specificType('data', db.client.config.client === 'mysql2' ? 'LONGBLOB' : 'BLOB');
            });
        }
        // Add deleted_at column for soft delete
        if (!(await db.schema.hasColumn('neurofy_files', 'deleted_at'))) {
            await db.schema.alterTable('neurofy_files', (table) => {
                table.timestamp('deleted_at');
            });
        }
    }
    // 11. neurofy_pages
    const hasPagesTable = await db.schema.hasTable('neurofy_pages');
    if (!hasPagesTable) {
        await db.schema.createTable('neurofy_pages', (table) => {
            table.increments('id').primary();
            table.string('title').notNullable();
            table.string('path').notNullable().unique();
            table.string('slug').notNullable();
            table.string('status').defaultTo('draft');
            table.string('layout').defaultTo('default');
            table.text('content');
            table.string('meta_title');
            table.text('meta_description');
            table.integer('parent_id').unsigned().references('id').inTable('neurofy_pages').onDelete('SET NULL');
            table.integer('sort_order').defaultTo(0);
            table.string('icon');
            table.boolean('show_in_nav').defaultTo(false);
            table.text('roles').defaultTo('["admin", "editor", "viewer"]');
            table.string('redirect_url');
            table.string('created_by');
            table.string('updated_by');
            table.timestamp('created_at').defaultTo(db.fn.now());
            table.timestamp('updated_at').defaultTo(db.fn.now());
        });
        // Seed initial page
        await db('neurofy_pages').insert({
            title: 'Welcome',
            path: '/',
            slug: 'welcome',
            status: 'published',
            content: '<h1>Welcome to NexDirect</h1><p>Start managing your content here.</p>',
            show_in_nav: true,
            created_by: 'system'
        });
    }
    // 12. neurofy_flows
    const hasFlowsTable = await db.schema.hasTable('neurofy_flows');
    if (!hasFlowsTable) {
        await db.schema.createTable('neurofy_flows', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.text('description');
            table.string('icon').defaultTo('play_circle');
            table.string('status').defaultTo('active');
            table.text('steps_json').notNullable().defaultTo('[]');
            table.string('trigger_type').defaultTo('manual');
            table.string('created_by');
            table.timestamp('created_at').defaultTo(db.fn.now());
            table.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }
    // 13. neurofy_flow_logs
    const hasFlowLogsTable = await db.schema.hasTable('neurofy_flow_logs');
    if (!hasFlowLogsTable) {
        await db.schema.createTable('neurofy_flow_logs', (table) => {
            table.increments('id').primary();
            table.string('flow_id').references('id').inTable('neurofy_flows').onDelete('CASCADE');
            table.string('status').notNullable();
            table.text('output_json');
            table.integer('duration_ms').defaultTo(0);
            table.string('executed_by');
            table.timestamp('timestamp').defaultTo(db.fn.now());
        });
    }
    // 14. neurofy_translations
    const hasTranslationsTable = await db.schema.hasTable('neurofy_translations');
    if (!hasTranslationsTable) {
        await db.schema.createTable('neurofy_translations', (table) => {
            table.increments('id').primary();
            table.string('collection').notNullable();
            table.string('item_id').notNullable();
            table.string('locale').notNullable();
            table.string('field').notNullable();
            table.text('content');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }
    // 15. neurofy_ws_endpoints
    const hasWsTable = await db.schema.hasTable('neurofy_ws_endpoints');
    if (!hasWsTable) {
        await db.schema.createTable('neurofy_ws_endpoints', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.string('path').notNullable().unique();
            table.string('collection');
            table.text('events_json').defaultTo('[]');
            table.boolean('auth_required').defaultTo(true);
            table.text('roles_json').defaultTo('[]');
            table.string('status').defaultTo('active');
            table.text('description');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }
    console.log('✅ Database tables verified');
}
async function closeDatabase() {
    await db.destroy();
}
//# sourceMappingURL=database.js.map