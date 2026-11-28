
const allowedOrigins = (
    process.env.CLIENT_ORIGINS || 'http://localhost:5173'
)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const originProtection = (req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    // Read-only requests and CORS preflight requests don't need this check.
    if (safeMethods.includes(req.method)) {
        return next();
    }

    const requestOrigin = req.get('Origin');

    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
        return res.status(403).json({
            success: false,
            message: 'Request origin is not allowed.'
        });
    }

    next();
};

export default originProtection;
