"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const ws_1 = require("./utils/ws");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const items_routes_1 = __importDefault(require("./routes/items.routes"));
const collections_routes_1 = __importDefault(require("./routes/collections.routes"));
const schema_routes_1 = __importDefault(require("./routes/schema.routes"));
const relations_routes_1 = __importDefault(require("./routes/relations.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const files_routes_1 = __importDefault(require("./routes/files.routes"));
const flows_routes_1 = __importDefault(require("./routes/flows.routes"));
const roles_routes_1 = __importDefault(require("./routes/roles.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const webhooks_routes_1 = __importDefault(require("./routes/webhooks.routes"));
const trash_routes_1 = __importDefault(require("./routes/trash.routes"));
const revisions_routes_1 = __importDefault(require("./routes/revisions.routes"));
const comments_routes_1 = __importDefault(require("./routes/comments.routes"));
// import pagesRoutes from './routes/pages.routes';
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const templates_routes_1 = __importDefault(require("./routes/templates.routes"));
const email_templates_routes_1 = __importDefault(require("./routes/email-templates.routes"));
const translations_routes_1 = __importDefault(require("./routes/translations.routes"));
const init_routes_1 = __importDefault(require("./routes/init.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const ws_routes_1 = __importDefault(require("./routes/ws.routes"));
const app = (0, express_1.default)();
// ── Middleware ──
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin === '*' ? true : config_1.config.corsOrigin.split(','),
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cookie_parser_1.default)());
// ── Static files ──
app.use('/uploads', express_1.default.static(config_1.config.uploadDir), (req, res, next) => {
    // Fallback to remote server in development if file not found locally
    if (config_1.config.nodeEnv !== 'production' && config_1.config.dbHost !== 'localhost' && config_1.config.dbHost !== '127.0.0.1') {
        const remoteUrl = `http://${config_1.config.dbHost}:${config_1.config.port}/uploads${req.url}`;
        return res.redirect(remoteUrl);
    }
    next();
});
// ── API Routes ──
app.use('/api/auth', auth_routes_1.default);
app.use('/api/items', items_routes_1.default);
app.use('/api/collections', collections_routes_1.default);
app.use('/api/schema', schema_routes_1.default);
app.use('/api/relations', relations_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/files', files_routes_1.default);
app.use('/api/flows', flows_routes_1.default);
app.use('/api/roles', roles_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/activity', activity_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/webhooks', webhooks_routes_1.default);
app.use('/api/trash', trash_routes_1.default);
app.use('/api/revisions', revisions_routes_1.default);
app.use('/api/comments', comments_routes_1.default);
// app.use('/api/pages', pagesRoutes);
app.use('/api/export', export_routes_1.default);
app.use('/api/import', import_routes_1.default);
app.use('/api/templates', templates_routes_1.default);
app.use('/api/email-templates', email_templates_routes_1.default);
app.use('/api/translations', translations_routes_1.default);
app.use('/api/init', init_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/ws-endpoints', ws_routes_1.default);
// ── Health check ──
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ── Error handler ──
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal server error' });
});
// ── Start ──
async function start() {
    const dbOk = await (0, database_1.initializeDatabase)();
    if (!dbOk) {
        console.error('❌ Failed to initialize database. Exiting.');
        process.exit(1);
    }
    // Multer writes to uploadDir/tmp before controllers run — must exist before any upload.
    await promises_1.default.mkdir(config_1.config.uploadDir, { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(config_1.config.uploadDir, 'tmp'), { recursive: true });
    const httpServer = http_1.default.createServer(app);
    ws_1.wsManager.init(httpServer);
    httpServer.listen(config_1.config.port, () => {
        console.log(`\n🚀 CMS Backend running on http://localhost:${config_1.config.port}`);
        console.log(`📁 Database: ${config_1.config.dbPath}`);
        console.log(`📂 Uploads: ${config_1.config.uploadDir}`);
        console.log(`🌐 CORS: ${config_1.config.corsOrigin}`);
        console.log(`🔌 WebSockets: Ready on /ws\n`);
    });
}
start();
//# sourceMappingURL=index.js.map