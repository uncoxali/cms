import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import { config } from './config';
import { initializeDatabase } from './config/database';
import { wsManager } from './utils/ws';

// Import routes
import authRoutes from './routes/auth.routes';
import itemsRoutes from './routes/items.routes';
import collectionsRoutes from './routes/collections.routes';
import schemaRoutes from './routes/schema.routes';
import relationsRoutes from './routes/relations.routes';
import dashboardRoutes from './routes/dashboard.routes';
import filesRoutes from './routes/files.routes';
import flowsRoutes from './routes/flows.routes';
import rolesRoutes from './routes/roles.routes';
import usersRoutes from './routes/users.routes';
import settingsRoutes from './routes/settings.routes';
import activityRoutes from './routes/activity.routes';
import analyticsRoutes from './routes/analytics.routes';
import webhooksRoutes from './routes/webhooks.routes';
import trashRoutes from './routes/trash.routes';
import revisionsRoutes from './routes/revisions.routes';
import commentsRoutes from './routes/comments.routes';
// import pagesRoutes from './routes/pages.routes';
import exportRoutes from './routes/export.routes';
import importRoutes from './routes/import.routes';
import templatesRoutes from './routes/templates.routes';
import emailTemplatesRoutes from './routes/email-templates.routes';
import translationsRoutes from './routes/translations.routes';
import initRoutes from './routes/init.routes';
import chatRoutes from './routes/chat.routes';
import aiRoutes from './routes/ai.routes';
import wsRoutes from './routes/ws.routes';

const app = express();

// ── Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ── Static files ──
app.use('/uploads', express.static(config.uploadDir), (req, res, next) => {
    // Fallback to remote server in development if file not found locally
    if (config.nodeEnv !== 'production' && config.dbHost !== 'localhost' && config.dbHost !== '127.0.0.1') {
        const remoteUrl = `http://${config.dbHost}:${config.port}/uploads${req.url}`;
        return res.redirect(remoteUrl);
    }
    next();
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/relations', relationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/flows', flowsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/revisions', revisionsRoutes);
app.use('/api/comments', commentsRoutes);
// app.use('/api/pages', pagesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/email-templates', emailTemplatesRoutes);
app.use('/api/translations', translationsRoutes);
app.use('/api/init', initRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ws-endpoints', wsRoutes);

// ── Health check ──
app.get('/api/health', (_req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ──
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal server error' });
});

// ── Start ──
async function start() {
    const dbOk = await initializeDatabase();
    if (!dbOk) {
        console.error('❌ Failed to initialize database. Exiting.');
        process.exit(1);
    }

    const httpServer = http.createServer(app);
    wsManager.init(httpServer);

    httpServer.listen(config.port, () => {
        console.log(`\n🚀 CMS Backend running on http://localhost:${config.port}`);
        console.log(`📁 Database: ${config.dbPath}`);
        console.log(`📂 Uploads: ${config.uploadDir}`);
        console.log(`🌐 CORS: ${config.corsOrigin}`);
        console.log(`🔌 WebSockets: Ready on /ws\n`);
    });
}

start();
