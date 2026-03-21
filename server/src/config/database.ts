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
        console.log('✅ Database connected:', config.dbPath);
        
        // Ensure required tables exist
        await ensureTables();
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

async function ensureTables() {
    // Create neurofy_trash table if not exists
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
        await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
    }

    // Create neurofy_templates table if not exists
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

    // Ensure neurofy_settings columns
    const hasSettingsTable = await db.schema.hasTable('neurofy_settings');
    if (hasSettingsTable) {
        const columns = await db.raw("PRAGMA table_info('neurofy_settings')");
        const colNames = columns.map((c: any) => c.name);
        
        if (!colNames.includes('token_expiration')) {
            await db.schema.alterTable('neurofy_settings', (table) => {
                table.integer('token_expiration').defaultTo(168);
            });
        }
        if (!colNames.includes('token_refresh_interval')) {
            await db.schema.alterTable('neurofy_settings', (table) => {
                table.integer('token_refresh_interval').defaultTo(12);
            });
        }
    }

    console.log('✅ Database tables verified');
}

export async function closeDatabase() {
    await db.destroy();
}
