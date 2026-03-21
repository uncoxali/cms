const knex = require('knex');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
});

async function checkFiles() {
    try {
        console.log('Connecting to:', process.env.DB_HOST);
        const stats = await db('neurofy_files')
            .select(
                db.raw('count(*) as total'),
                db.raw('count(data) as with_data'),
                db.raw('sum(case when data is null then 1 else 0 end) as without_data')
            )
            .first();
        
        console.log('File Statistics in DB:');
        console.log(JSON.stringify(stats, null, 2));

        const sample = await db('neurofy_files').select('filename_disk', 'storage', 'data').limit(5);
        console.log('\nSample Files:');
        console.log(sample.map(s => ({
            filename: s.filename_disk,
            storage: s.storage,
            hasData: !!s.data,
            dataLength: s.data ? s.data.length : 0
        })));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkFiles();
