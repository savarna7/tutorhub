import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const testEnvPath = fileURLToPath(
    new URL('../.env.test', import.meta.url)
);

dotenv.config({
    path: testEnvPath,
    override: true
});

// Safety guard: never allow automated tests to use another database.
if (process.env.DB_NAME !== 'tutorhub_test') {
    throw new Error(
        `Unsafe test database: ${process.env.DB_NAME}. ` +
        'Tests may only run against tutorhub_test.'
    );
}

if (process.env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV must be set to test.');
}

console.log('Test database safety check passed.');
