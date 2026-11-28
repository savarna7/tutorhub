
import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../src/middleware/rateLimiters.js';

describe('Rate Limiter Middleware', () => {
    it('should return 429 after the configured request limit is exceeded', async () => {
        const app = express();

        const limiter = createRateLimiter({
            windowMs: 60 * 1000,
            limit: 2,
            message: 'Too many requests. Please try again later.',
            skipInTest: false
        });

        app.get('/limited', limiter, (req, res) => {
            res.status(200).json({
                success: true
            });
        });

        // First request should succeed.
        const firstResponse = await request(app).get('/limited');
        expect(firstResponse.status).toBe(200);

        // Second request should also succeed.
        const secondResponse = await request(app).get('/limited');
        expect(secondResponse.status).toBe(200);

        // Third request should be blocked.
        const thirdResponse = await request(app).get('/limited');

        expect(thirdResponse.status).toBe(429);
        expect(thirdResponse.body.success).toBe(false);
        expect(thirdResponse.body.message).toBe(
            'Too many requests. Please try again later.'
        );
    });

    it('should skip rate limiting in the test environment by default', async () => {
        const app = express();

        const limiter = createRateLimiter({
            windowMs: 60 * 1000,
            limit: 2,
            message: 'Too many requests. Please try again later.'
        });

        app.get('/limited', limiter, (req, res) => {
            res.status(200).json({
                success: true
            });
        });

        // All three requests should succeed because NODE_ENV is test.
        for (let i = 0; i < 3; i++) {
            const response = await request(app).get('/limited');
            expect(response.status).toBe(200);
        }
    });
});
