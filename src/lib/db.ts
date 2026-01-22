import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    // We don't throw error immediately to allow build to pass if env is missing during build time
    console.warn('DATABASE_URL is not defined');
}

// Global pool to prevent multiple connections in dev
const globalForDb = global as unknown as { pool: Pool };

let pool: Pool;


if (!globalForDb.pool) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    if (process.env.NODE_ENV !== 'production') {
        globalForDb.pool = pool;
    }
} else {
    pool = globalForDb.pool;
}

export default pool;

// Helper type for global
declare const globalAsAny: any;
