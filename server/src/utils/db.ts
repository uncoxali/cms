import { db } from '../config/database';

export function isMySQL(): boolean {
    const client = db.client?.config?.client;
    const dialect = db.client?.dialect;
    const isMySqlMatch = (
        client === 'mysql' || 
        client === 'mysql2' || 
        dialect === 'mysql' || 
        dialect === 'mariadb'
    );
    if (!isMySqlMatch) {
       console.log('[isMySQL] False negative! client:', client, 'dialect:', dialect);
    }
    return isMySqlMatch;
}

export async function getTables(): Promise<{ name: string }[]> {
    if (isMySQL()) {
        const dbName = db.client.connectionSettings.database;
        const [rows] = await db.raw(
            "SELECT TABLE_NAME as name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME NOT LIKE 'knex_%' ORDER BY TABLE_NAME",
            [dbName]
        );
        return Array.isArray(rows) ? (rows as any[]) : [rows];
    } else {
        const rows = await db.raw(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name`
        );
        return rows as { name: string }[];
    }
}
