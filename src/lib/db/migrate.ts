import { Knex } from 'knex';

export async function runMigrations(db: Knex) {
    // ---- neurofy_roles ----
    if (!(await db.schema.hasTable('neurofy_roles'))) {
        await db.schema.createTable('neurofy_roles', (t) => {
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

    // ---- neurofy_users ----
    if (!(await db.schema.hasTable('neurofy_users'))) {
        await db.schema.createTable('neurofy_users', (t) => {
            t.string('id').primary();
            t.string('email').notNullable().unique();
            t.string('password_hash').notNullable();
            t.string('first_name').nullable();
            t.string('last_name').nullable();
            t.string('role').references('id').inTable('neurofy_roles').nullable();
            t.string('status').defaultTo('active'); // active | suspended | invited
            t.string('avatar').nullable();
            t.text('description').nullable();
            t.timestamp('last_access').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_activity ----
    if (!(await db.schema.hasTable('neurofy_activity'))) {
        await db.schema.createTable('neurofy_activity', (t) => {
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

    // ---- neurofy_files ----
    if (!(await db.schema.hasTable('neurofy_files'))) {
        await db.schema.createTable('neurofy_files', (t) => {
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

    // ---- neurofy_folders ----
    if (!(await db.schema.hasTable('neurofy_folders'))) {
        await db.schema.createTable('neurofy_folders', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('parent').nullable();
        });
    }

    // ---- neurofy_flows ----
    if (!(await db.schema.hasTable('neurofy_flows'))) {
        await db.schema.createTable('neurofy_flows', (t) => {
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

    // ---- neurofy_flow_logs ----
    if (!(await db.schema.hasTable('neurofy_flow_logs'))) {
        await db.schema.createTable('neurofy_flow_logs', (t) => {
            t.increments('id').primary();
            t.string('flow_id').references('id').inTable('neurofy_flows').onDelete('CASCADE');
            t.string('status').defaultTo('success'); // success|error|warning
            t.timestamp('started_at').defaultTo(db.fn.now());
            t.integer('duration').defaultTo(0); // ms
            t.string('trigger_type').nullable();
            t.text('steps_json').defaultTo('[]');
            t.text('error').nullable();
        });
    }

    // ---- neurofy_webhooks ----
    if (!(await db.schema.hasTable('neurofy_webhooks'))) {
        await db.schema.createTable('neurofy_webhooks', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('method').defaultTo('POST');
            t.string('url').notNullable();
            t.text('collections_json').defaultTo('[]');
            t.text('events_json').defaultTo('[]');
            t.text('headers_json').defaultTo('[]');
            t.text('auth_json').defaultTo('{"type":"none"}');
            t.string('status').defaultTo('active');
            t.string('secret').nullable();
            t.float('success_rate').defaultTo(100);
            t.timestamp('last_triggered').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_webhook_logs ----
    if (!(await db.schema.hasTable('neurofy_webhook_logs'))) {
        await db.schema.createTable('neurofy_webhook_logs', (t) => {
            t.increments('id').primary();
            t.string('webhook_id')
                .references('id')
                .inTable('neurofy_webhooks')
                .onDelete('CASCADE');
            t.integer('status').notNullable();        // HTTP status or 0 on network error
            t.text('request_body').notNullable();     // JSON payload
            t.text('response_body').notNullable();    // raw response / error text
            t.timestamp('timestamp').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_settings ----
    if (!(await db.schema.hasTable('neurofy_settings'))) {
        await db.schema.createTable('neurofy_settings', (t) => {
            t.increments('id').primary();
            t.string('project_name').defaultTo('NexDirect');
            t.text('project_description').nullable();
            t.string('project_color').defaultTo('#6644ff');
            t.string('project_logo').nullable();
            t.string('default_locale').defaultTo('en-US');
            t.string('default_timezone').defaultTo('UTC');
            t.string('theme').defaultTo('dark');
            t.string('theme_preset').defaultTo('midnight');
            t.string('default_font').defaultTo('Inter');
            t.integer('default_page_size').defaultTo(25);
            t.string('default_sort_field').defaultTo('id');
            t.string('default_sort_order').defaultTo('asc');
            t.string('date_format').defaultTo('YYYY-MM-DD');
            t.string('number_format').defaultTo('comma');
            t.text('feature_flags_json').defaultTo('{}');
            t.text('custom_themes_json').nullable();
            // Store SEO settings as a JSON blob to avoid schema churn.
            t.text('seo_json').nullable();
        });
    } else {
        // Add theme_preset column if it doesn't exist
        const hasThemePreset = await db.schema.hasColumn('neurofy_settings', 'theme_preset');
        if (!hasThemePreset) {
            await db.schema.alterTable('neurofy_settings', (t) => {
                t.string('theme_preset').defaultTo('midnight');
            });
        }
        // Add custom_themes_json column if it doesn't exist
        const hasCustomThemes = await db.schema.hasColumn('neurofy_settings', 'custom_themes_json');
        if (!hasCustomThemes) {
            await db.schema.alterTable('neurofy_settings', (t) => {
                t.text('custom_themes_json').nullable();
            });
        }
        // Add seo_json column if it doesn't exist
        const hasSeoJson = await db.schema.hasColumn('neurofy_settings', 'seo_json');
        if (!hasSeoJson) {
            await db.schema.alterTable('neurofy_settings', (t) => {
                t.text('seo_json').nullable();
            });
        }
    }

    // ---- neurofy_collections_meta (extra metadata per collection) ----
    if (!(await db.schema.hasTable('neurofy_collections_meta'))) {
        await db.schema.createTable('neurofy_collections_meta', (t) => {
            t.string('collection').primary();
            t.string('label').nullable();
            t.string('icon').nullable();
            t.text('description').nullable();
            t.boolean('hidden').defaultTo(false);
            t.string('sort_field').nullable();
            t.text('searchable_fields_json').defaultTo('[]');
        });
    }

    // ---- neurofy_relations (relation metadata for FK fields) ----
    if (!(await db.schema.hasTable('neurofy_relations'))) {
        await db.schema.createTable('neurofy_relations', (t) => {
            t.increments('id').primary();
            t.string('collection').notNullable();
            t.string('field').notNullable();
            t.string('related_collection').notNullable();
            t.string('related_field').defaultTo('id');
            t.string('display_field').defaultTo('id');
            t.string('on_delete').defaultTo('SET NULL');
            t.boolean('required').defaultTo(false);
            t.unique(['collection', 'field']);
        });
    }

    // ---- neurofy_pages (route/page management) ----
    if (!(await db.schema.hasTable('neurofy_pages'))) {
        await db.schema.createTable('neurofy_pages', (t) => {
            t.increments('id').primary();
            t.string('title').notNullable();
            t.string('path').notNullable().unique();
            t.string('slug').notNullable();
            t.string('status').defaultTo('draft'); // draft | published | archived
            t.string('layout').defaultTo('default'); // default | full-width | sidebar | blank
            t.text('content').nullable(); // HTML content
            t.string('meta_title').nullable();
            t.text('meta_description').nullable();
            t.string('parent_id').nullable();
            t.integer('sort_order').defaultTo(0);
            t.string('icon').nullable();
            t.boolean('show_in_nav').defaultTo(false);
            t.string('redirect_url').nullable();
            t.text('roles').defaultTo('[]'); // JSON array of role IDs that can see this page
            t.string('created_by').nullable();
            t.string('updated_by').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_ws_endpoints (custom WebSocket endpoints) ----
    if (!(await db.schema.hasTable('neurofy_ws_endpoints'))) {
        await db.schema.createTable('neurofy_ws_endpoints', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('path').notNullable().unique();
            t.string('collection').nullable();
            t.text('events_json').defaultTo('[]');
            t.boolean('auth_required').defaultTo(true);
            t.text('roles_json').defaultTo('[]');
            t.string('status').defaultTo('active');
            t.text('description').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_chat_rooms ----
    if (!(await db.schema.hasTable('neurofy_chat_rooms'))) {
        await db.schema.createTable('neurofy_chat_rooms', (t) => {
            t.string('id').primary();
            t.string('name').nullable();
            t.string('type').defaultTo('group'); // direct | group
            t.text('members_json').defaultTo('[]');
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.timestamp('updated_at').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_chat_messages ----
    if (!(await db.schema.hasTable('neurofy_chat_messages'))) {
        await db.schema.createTable('neurofy_chat_messages', (t) => {
            t.increments('id').primary();
            t.string('room_id').references('id').inTable('neurofy_chat_rooms').onDelete('CASCADE');
            t.string('user_id').notNullable();
            t.string('user_email').nullable();
            t.text('message').notNullable();
            t.string('type').defaultTo('text'); // text | system
            t.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    // ---- neurofy_translations (multilingual content) ----
    if (!(await db.schema.hasTable('neurofy_translations'))) {
        await db.schema.createTable('neurofy_translations', (t) => {
            t.increments('id').primary();
            t.string('collection').notNullable();
            t.string('item_id').notNullable();
            t.string('field').notNullable();
            t.string('locale').notNullable();
            t.text('value').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.timestamp('updated_at').defaultTo(db.fn.now());
            t.unique(['collection', 'item_id', 'field', 'locale']);
        });
    }

    // ---- field_comments (field-level comments for collaborative editing) ----
    if (!(await db.schema.hasTable('field_comments'))) {
        await db.schema.createTable('field_comments', (t) => {
            t.string('id').primary();
            t.string('collection').notNullable();
            t.string('item_id').notNullable();
            t.string('field_name').notNullable();
            t.string('user_id').notNullable();
            t.string('user_name').notNullable();
            t.string('user_avatar').nullable();
            t.text('content').notNullable();
            t.boolean('resolved').defaultTo(false);
            t.string('resolved_by').nullable();
            t.timestamp('resolved_at').nullable();
            t.timestamp('created_at').defaultTo(db.fn.now());
            t.index(['collection', 'item_id']);
        });
    }

    console.log('[DB] Migrations complete');
}
