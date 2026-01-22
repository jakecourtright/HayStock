const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
// Load .env.local manually since this is a standalone script
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing. Please set it in .env.local');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    try {
        console.log('Running migration...');
        await pool.query(schemaSql);
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
