
import { rateLimit } from 'express-rate-limit';

// Create a reusable rate limiter.
// Tests can disable the test-environment bypass when needed.
export const createRateLimiter = ({
    windowMs,
    limit,
    message,
    skipInTest = true
}) => {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skip: () => skipInTest && process.env.NODE_ENV === 'test',
        message: {
            success: false,
            message
        }
    });
};
