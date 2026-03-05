import { Knex } from 'knex';

export async function runMigrations(db: Knex) {
    // ---- directus_roles ----
    if (!(await db.schema.hasTable('directus_roles'))) {
        await db.schema.createTable('directus_roles', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.text('description').nullable();
            t.boolean('admin_access').defaultTo(false);
            t.boolean('app_access').defaultTo(true);
            t.text('icon').defaultTo('supervised_user_circle');
            t.text('permissions_json').defaultTo('{}'); // JSON blob for collection permissions
            t.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    // ---- directus_users ----
    if (!(await db.schema.hasTable('directus_users'))) {
        await db.schema.createTable('directus_users', (t) => {
            t.string('id').primary();
            t.string('email').notNullable().unique();
            t.string('password_hash').notNullable();
            t.string('first_name').nullable();
            t.string('last_name').nullable();
            t.string('role').references('id').inTable('directus_roles').nullable();
            t.string('status').defaultTo('active'); // active | suspended | invited
            t.string('avatar').nullable();
            t.text('description').nullable();
            t.timestamp('last_access').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    // ---- directus_activity ----
    if (!(await db.schema.hasTable('directus_activity'))) {
        await db.schema.createTable('directus_activity', (t) => {
            t.increments('id').primary();
            t.string('action').notNullable(); // create|update|delete|login|logout
            t.string('user').nullable();
            t.string('user_id').nullable();
            t.timestamp('timestamp').defaultTo(db.fn.now());
            t.string('ip').nullable();
            t.string('user_agent').nullable();
            t.string('collection').nullable();
            t.string('item').nullable();
            t.text('comment').nullable();
            t.text('meta_json').nullable(); // JSON blob
        });
    }

    // ---- directus_files ----
    if (!(await db.schema.hasTable('directus_files'))) {
        await db.schema.createTable('directus_files', (t) => {
            t.string('id').primary();
            t.string('storage').defaultTo('local'); // local | s3
            t.string('filename_disk').notNullable();
            t.string('filename_download').notNullable();
            t.string('title').nullable();
            t.string('type').nullable(); // image | video | document | audio | archive
            t.string('mime_type').nullable();
            t.integer('filesize').defaultTo(0);
            t.integer('width').nullable();
            t.integer('height').nullable();
            t.text('description').nullable();
            t.text('tags_json').defaultTo('[]');
            t.string('folder').nullable();
            t.string('uploaded_by').nullable();
            t.timestamp('uploaded_on').defaultTo(db.fn.now());
            t.timestamp('modified_on').defaultTo(db.fn.now());
            t.boolean('is_favorite').defaultTo(false);
        });
    }

    // ---- directus_folders ----
    if (!(await db.schema.hasTable('directus_folders'))) {
        await db.schema.createTable('directus_folders', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('parent').nullable();
        });
    }

    // ---- directus_flows ----
    if (!(await db.schema.hasTable('directus_flows'))) {
        await db.schema.createTable('directus_flows', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.text('description').nullable();
            t.string('icon').nullable();
            t.string('color').nullable();
            t.string('status').defaultTo('active');
            t.string('trigger_type').nullable(); // hook|webhook|schedule|operation|manual
            t.text('trigger_options_json').defaultTo('{}');
            t.text('operations_json').defaultTo('[]');
            t.string('permission').defaultTo('$full');
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }

    // ---- directus_flow_logs ----
    if (!(await db.schema.hasTable('directus_flow_logs'))) {
        await db.schema.createTable('directus_flow_logs', (t) => {
            t.increments('id').primary();
            t.string('flow_id').references('id').inTable('directus_flows').onDelete('CASCADE');
            t.string('status').defaultTo('success'); // success|error|warning
            t.timestamp('started_at').defaultTo(db.fn.now());
            t.integer('duration').defaultTo(0); // ms
            t.string('trigger_type').nullable();
            t.text('steps_json').defaultTo('[]');
            t.text('error').nullable();
        });
    }

    // ---- directus_settings ----
    if (!(await db.schema.hasTable('directus_settings'))) {
        await db.schema.createTable('directus_settings', (t) => {
            t.increments('id').primary();
            t.string('project_name').defaultTo('NexDirect');
            t.text('project_description').nullable();
            t.string('project_color').defaultTo('#6644ff');
            t.string('project_logo').nullable();
            t.string('default_locale').defaultTo('en-US');
            t.string('default_timezone').defaultTo('UTC');
            t.string('theme').defaultTo('dark');
            t.string('default_font').defaultTo('Inter');
            t.integer('default_page_size').defaultTo(25);
            t.string('default_sort_field').defaultTo('id');
            t.string('default_sort_order').defaultTo('asc');
            t.string('date_format').defaultTo('YYYY-MM-DD');
            t.string('number_format').defaultTo('comma');
            t.text('feature_flags_json').defaultTo('{}');
        });
    }

    // ---- directus_collections_meta (extra metadata per collection) ----
    if (!(await db.schema.hasTable('directus_collections_meta'))) {
        await db.schema.createTable('directus_collections_meta', (t) => {
            t.string('collection').primary();
            t.string('label').nullable();
            t.string('icon').nullable();
            t.text('description').nullable();
            t.boolean('hidden').defaultTo(false);
            t.string('sort_field').nullable();
            t.text('searchable_fields_json').defaultTo('[]');
        });
    }

    console.log('[DB] Migrations complete');
}
