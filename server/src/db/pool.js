
import { Pool } from 'pg';
import 'dotenv/config';

const isTestEnvironment = process.env.NODE_ENV === 'test';
const databaseUrl = process.env.DATABASE_URL;

// Production must use the managed database connection URL.
if (
    process.env.NODE_ENV === 'production' &&
    !databaseUrl
) {
    throw new Error('DATABASE_URL is required in production.');
}

// Tests must always use their dedicated local test database.
// Development can use either DATABASE_URL or individual DB variables.
const poolConfig =
    databaseUrl && !isTestEnvironment
        ? {
            connectionString: databaseUrl,
            connectionTimeoutMillis: 5000
        }
        : {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 5432),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectionTimeoutMillis: 5000
        };

const pool = new Pool(poolConfig);

export default pool;
