import knex, { Knex } from 'knex';
import path from 'path';

let _db: Knex | null = null;

export function getDb(): Knex {
    if (!_db) {
        _db = knex({
            client: 'better-sqlite3',
            connection: {
                filename: path.join(process.cwd(), 'data', 'nexdirect.db'),
            },
            useNullAsDefault: true,
        });
    }
    return _db;
}
