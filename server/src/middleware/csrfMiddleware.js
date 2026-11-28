
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

// Generate a signed CSRF token bound to the current authentication cookie
export const generateCsrfToken = (authToken) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
    }

    const token = randomBytes(32).toString('hex');

    const signature = createHmac('sha256', process.env.JWT_SECRET)
        .update(`csrf:${authToken}:${token}`)
        .digest('hex');

    return `${token}.${signature}`;
};

// Validate the CSRF cookie and request header
const csrfProtection = (req, res, next) => {
        if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured.');

        return res.status(500).json({
            success: false,
            message: 'Could not validate security token.'
        });
    }
    const csrfCookie = req.cookies?.csrfToken;
    const csrfHeader = req.get('X-CSRF-Token');
    const authToken = req.cookies?.token;

    if (!csrfCookie || !csrfHeader || !authToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF validation failed. Please refresh and try again.'
        });
    }

    const [token, receivedSignature, ...extraParts] = csrfCookie.split('.');

    if (
        !token ||
        !receivedSignature ||
        extraParts.length > 0 ||
        csrfHeader !== token ||
        !/^[a-f0-9]{64}$/i.test(token) ||
        !/^[a-f0-9]{64}$/i.test(receivedSignature)
    ) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token.'
        });
    }

    const expectedSignature = createHmac('sha256', process.env.JWT_SECRET)
        .update(`csrf:${authToken}:${token}`)
        .digest('hex');

    const receivedBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token.'
        });
    }

    next();
};

export default csrfProtection;
