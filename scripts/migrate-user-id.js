const { Pool } = require('@neondatabase/serverless');
const path = require('path');
// Load .env.local manually since this is a standalone script
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function migrateUserIdColumns() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing. Please set it in .env.local');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Starting user_id column type migration...');

        // Check current column types first
        const checkQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('locations', 'stacks', 'transactions') 
            AND column_name = 'user_id'
            ORDER BY table_name;
        `;
        const currentTypes = await pool.query(checkQuery);
        console.log('Current user_id column types:');
        currentTypes.rows.forEach(row => {
            console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
        });

        // Drop the foreign key constraints first (they reference the old users table)
        console.log('\nDropping old foreign key constraints...');

        const dropConstraints = `
            ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_user_id_fkey;
            ALTER TABLE stacks DROP CONSTRAINT IF EXISTS stacks_user_id_fkey;
            ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
        `;
        await pool.query(dropConstraints);
        console.log('  Constraints dropped.');

        // Alter user_id columns to VARCHAR(255)
        console.log('\nAltering user_id columns to VARCHAR(255)...');

        const alterColumns = `
            ALTER TABLE locations ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::TEXT;
            ALTER TABLE stacks ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::TEXT;
            ALTER TABLE transactions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::TEXT;
        `;
        await pool.query(alterColumns);
        console.log('  Columns altered.');

        // Add NOT NULL constraint if not already present
        console.log('\nEnsuring NOT NULL constraints...');
        const addNotNull = `
            ALTER TABLE locations ALTER COLUMN user_id SET NOT NULL;
            ALTER TABLE stacks ALTER COLUMN user_id SET NOT NULL;
            ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
        `;
        await pool.query(addNotNull);
        console.log('  NOT NULL constraints set.');

        // Verify the changes
        const verifyTypes = await pool.query(checkQuery);
        console.log('\nUpdated user_id column types:');
        verifyTypes.rows.forEach(row => {
            console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
        });

        console.log('\n✅ Migration successful!');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrateUserIdColumns();
