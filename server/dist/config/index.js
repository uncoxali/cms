"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-this',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    dbClient: process.env.DB_CLIENT || 'sqlite3',
    dbPath: process.env.DB_PATH || path_1.default.join(process.cwd(), '..', 'data', 'nexdirect.db'),
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'nexdirect',
    uploadDir: process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50') * 1024 * 1024,
    corsOrigin: process.env.CORS_ORIGIN || '*',
};
//# sourceMappingURL=index.js.map