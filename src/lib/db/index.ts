import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';

let _db: Knex | null = null;

export function getDb(): Knex {
    if (!_db) {
        const isProd = process.env.NODE_ENV === 'production';

        // In production (e.g. Vercel), the filesystem where the app is deployed is read-only.
        // We copy the bundled SQLite file to /tmp (writable) and use that as the live database.
        const baseFilename = 'nexdirect.db';

        let filename: string;

        if (isProd) {
            const sourcePath = path.join(process.cwd(), 'data', baseFilename);
            const tmpDir = '/tmp';
            const tmpPath = path.join(tmpDir, baseFilename);

            try {
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Only copy if the DB file doesn't already exist in /tmp
                if (!fs.existsSync(tmpPath) && fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, tmpPath);
                }

                filename = tmpPath;
            } catch {
                // Fallback to the original path if anything goes wrong
                filename = path.join(process.cwd(), 'data', baseFilename);
            }
        } else {
            // Local development uses the repo's data directory directly
            filename = path.join(process.cwd(), 'data', baseFilename);
        }

        _db = knex({
            client: 'better-sqlite3',
            connection: {
                filename,
            },
            useNullAsDefault: true,
        });
    }
    return _db;
}
