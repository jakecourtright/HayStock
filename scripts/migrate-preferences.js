const { Pool } = require('@neondatabase/serverless');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing. Please set it in .env.local');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Creating user_preferences table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                org_id VARCHAR(255) NOT NULL,
                preference_key VARCHAR(100) NOT NULL,
                preference_value JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, org_id, preference_key)
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_user_preferences_lookup 
            ON user_preferences(user_id, org_id, preference_key);
        `);

        console.log('✅ user_preferences table created successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
