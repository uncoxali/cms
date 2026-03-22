import knex from 'knex';
declare const db: knex.Knex<any, unknown[]>;
export { db };
export declare function initializeDatabase(): Promise<boolean>;
export declare function closeDatabase(): Promise<void>;
