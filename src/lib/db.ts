import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Enable WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not defined');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default pool;
