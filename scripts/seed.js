const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function seed() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    const email = 'user@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        console.log('Seeding initial user...');

        // Check if user exists
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0) {
            console.log('User already exists');
        } else {
            await pool.query(
                'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
                ['Demo User', email, hashedPassword]
            );
            console.log(`User created! Email: ${email}, Password: ${password}`);
        }

    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await pool.end();
    }
}

seed();
