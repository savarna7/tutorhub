
import { describe, it, expect, vi } from 'vitest';
import csrfProtection from '../src/middleware/csrfMiddleware.js';

describe('CSRF Middleware', () => {
    it('should return 500 when JWT_SECRET is not configured', () => {
        const originalSecret = process.env.JWT_SECRET;

        delete process.env.JWT_SECRET;

        const req = {
            cookies: {},
            get: vi.fn()
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        const next = vi.fn();

        try {
            csrfProtection(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Could not validate security token.'
            });
            expect(next).not.toHaveBeenCalled();
        } finally {
            // Restore the original environment variable.
            if (originalSecret === undefined) {
                delete process.env.JWT_SECRET;
            } else {
                process.env.JWT_SECRET = originalSecret;
            }
        }
    });
});
