import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-this',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    dbClient: process.env.DB_CLIENT || 'sqlite3',
    dbPath: process.env.DB_PATH || path.join(process.cwd(), '..', 'data', 'nexdirect.db'),
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'nexdirect',
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), '..', 'public', 'uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50') * 1024 * 1024,
    corsOrigin: process.env.CORS_ORIGIN || '*',
};
