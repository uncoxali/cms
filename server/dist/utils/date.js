"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDbDate = toDbDate;
const database_1 = require("../config/database");
/**
 * Formats a date for database insertion/update.
 * Handles differences between SQLite (ISO 8601) and MySQL/MariaDB (YYYY-MM-DD HH:mm:ss).
 */
function toDbDate(date = new Date()) {
    const isMySql = database_1.db.client.config.client === 'mysql' || database_1.db.client.config.client === 'mysql2';
    if (isMySql) {
        // Format: YYYY-MM-DD HH:mm:ss
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    // SQLite handles ISO strings fine
    return date.toISOString();
}
//# sourceMappingURL=date.js.map