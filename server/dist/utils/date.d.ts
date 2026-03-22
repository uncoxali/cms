/**
 * Formats a date for database insertion/update.
 * Handles differences between SQLite (ISO 8601) and MySQL/MariaDB (YYYY-MM-DD HH:mm:ss).
 */
export declare function toDbDate(date?: Date): any;
