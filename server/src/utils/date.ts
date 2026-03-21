import { db } from '../config/database';

/**
 * Formats a date for database insertion/update.
 * Handles differences between SQLite (ISO 8601) and MySQL/MariaDB (YYYY-MM-DD HH:mm:ss).
 */
export function toDbDate(date: Date = new Date()): any {
    const isMySql = db.client.config.client === 'mysql' || db.client.config.client === 'mysql2';
    
    if (isMySql) {
        // Format: YYYY-MM-DD HH:mm:ss
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // SQLite handles ISO strings fine
    return date.toISOString();
}
