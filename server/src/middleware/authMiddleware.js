
import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check whether the token was provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }

    // 3. Extract the token
    const token = authHeader.split(' ')[1];

    // 4. Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach authenticated user information
        req.user = {
            id: decoded.sub,
            role: decoded.role
        };

        // 6. Continue to the route handler
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

export default authenticateToken;
