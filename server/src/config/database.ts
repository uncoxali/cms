import knex from 'knex';
import { config } from './index';

const db = knex({
    client: config.dbClient === 'mysql' || config.dbClient === 'mysql2' ? 'mysql2' : 'better-sqlite3',
    connection: config.dbClient === 'mysql' || config.dbClient === 'mysql2' 
        ? {
            host: config.dbHost,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName,
        }
        : {
            filename: config.dbPath,
        },
    useNullAsDefault: true,
});

export { db };

export async function initializeDatabase() {
    try {
        await db.raw('SELECT 1');
        console.log('✅ Database connected. Client:', db.client.config.client);
        console.log('📂 Database path (if SQLite):', config.dbPath);
        
        // Ensure required tables exist
        await ensureTables();
        
        return true;
    } catch (error) {
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
    } else {
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
    }

    // 4. neurofy_trash
    const hasTrashTable = await db.schema.hasTable('neurofy_trash');
    if (!hasTrashTable) {
        await db.schema.createTable('neurofy_trash', (table) => {
            table.increments('trash_id').primary();
            table.string('item_id').notNullable();
            table.string('collection').notNullable();
            table.text('data_json').notNullable();
            table.string('deleted_by');
            table.timestamp('deleted_at').defaultTo(db.fn.now());
            table.timestamp('expires_at');
        });
        if (db.client.config.client !== 'mysql2') {
            await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
        } else {
            await db.schema.alterTable('neurofy_trash', (table) => {
                table.unique(['item_id', 'collection'], { indexName: 'idx_trash_item' });
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

    console.log('✅ Database tables verified');
}

export async function closeDatabase() {
    await db.destroy();
}
