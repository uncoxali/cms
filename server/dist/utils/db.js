"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMySQL = isMySQL;
exports.getTables = getTables;
const database_1 = require("../config/database");
const index_1 = require("../config/index");
function isMySQL() {
    const client = index_1.config.dbClient;
    return client === 'mysql' || client === 'mysql2';
}
async function getTables() {
    if (isMySQL()) {
        const dbName = database_1.db.client.connectionSettings.database;
        const [rows] = await database_1.db.raw("SELECT TABLE_NAME as name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME NOT LIKE 'knex_%' ORDER BY TABLE_NAME", [dbName]);
        return Array.isArray(rows) ? rows : [rows];
    }
    else {
        const rows = await database_1.db.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name`);
        return rows;
    }
}
//# sourceMappingURL=db.js.map