import { createRateLimiter } from '../middleware/rateLimiters.js';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import authenticateToken from '../middleware/authMiddleware.js';
import csrfProtection, {
    generateCsrfToken
} from '../middleware/csrfMiddleware.js';

const router = express.Router();
const registerLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: 'Too many registration attempts. Please try again later.'
});

const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Too many login attempts. Please try again later.'
});
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/'
});

const getCsrfCookieOptions = () => ({
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/'
});

// POST /api/auth/register
router.post('/register', registerLimiter, async (req, res) => {
    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Request body must be a valid JSON object.'
        });
    }

    const {
        fullName,
        email,
        password,
        role,
        educationLevel,
        learningGoals,
        qualification,
        experienceYears,
        hourlyRate,
        bio,
        subjectIds
    } = req.body;

    // Validate name
    if (
        typeof fullName !== 'string' ||
        !fullName.trim() ||
        fullName.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: 'Name is required and must not exceed 100 characters.'
        });
    }

    // Validate email
    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            success: false,
            message: 'A valid email address is required.'
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address.'
        });
    }

    // Validate password
    if (
        typeof password !== 'string' ||
        password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).json({
            success: false,
            message: 'Password must contain at least 8 characters and must not exceed 72 bytes.'
        });
    }

    // Validate role
    const validRoles = ['student', 'tutor', 'both'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Role must be student, tutor, or both.'
        });
    }

    const hasStudentProfile = role === 'student' || role === 'both';
    const hasTutorProfile = role === 'tutor' || role === 'both';

    // Validate student information
    if (hasStudentProfile) {
        if (
            typeof educationLevel !== 'string' ||
            !educationLevel.trim() ||
            educationLevel.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid education level (maximum 100 characters).'
            });
        }

        if (
            typeof learningGoals !== 'string' ||
            !learningGoals.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please describe your learning goals.'
            });
        }
    }

    let validatedHourlyRate;
    let validatedExperienceYears;
    let validatedQualification;
    let validatedBio;
    let validatedSubjectIds = [];

    // Validate tutor information
    if (hasTutorProfile) {
        if (
            typeof qualification !== 'string' ||
            !qualification.trim() ||
            qualification.trim().length > 150
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid qualification (maximum 150 characters).'
            });
        }

        if (
            typeof bio !== 'string' ||
            !bio.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your teaching bio.'
            });
        }

        validatedQualification = qualification.trim();
        validatedBio = bio.trim();

        // Validate experience: 0 to 60 years, up to one decimal place
        if (
            experienceYears === undefined ||
            experienceYears === null ||
            experienceYears === '' ||
            !Number.isFinite(Number(experienceYears)) ||
            Number(experienceYears) < 0 ||
            Number(experienceYears) > 60 ||
            Math.abs(
                Number(experienceYears) * 10 -
                Math.round(Number(experienceYears) * 10)
            ) > 0.000001
        ) {
            return res.status(400).json({
                success: false,
                message: 'Experience must be between 0 and 60 years, with at most one decimal place.'
            });
        }

        validatedExperienceYears = Number(experienceYears);

        // Validate hourly rate
        if (
            hourlyRate === undefined ||
            hourlyRate === null ||
            hourlyRate === '' ||
            !Number.isFinite(Number(hourlyRate)) ||
            Number(hourlyRate) < 0 ||
            Number(hourlyRate) > 99999999.99 ||
            Math.abs(
                Number(hourlyRate) * 100 -
                Math.round(Number(hourlyRate) * 100)
            ) > 0.000001
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid hourly rate.'
            });
        }

        validatedHourlyRate = Number(hourlyRate);

        // Validate selected subjects
        if (
            !Array.isArray(subjectIds) ||
            subjectIds.length === 0 ||
            !subjectIds.every(
                (id) => Number.isSafeInteger(id) && id > 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one valid subject.'
            });
        }

        // Reject duplicate subject IDs
        validatedSubjectIds = [...new Set(subjectIds)];

        if (validatedSubjectIds.length !== subjectIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate subjects are not allowed.'
            });
        }
    }

    let client;

    try {
        // Confirm that all selected subjects exist
        if (hasTutorProfile) {
            const subjectsResult = await pool.query(
                `SELECT id
                 FROM subjects
                 WHERE id = ANY($1::bigint[])`,
                [validatedSubjectIds]
            );

            if (subjectsResult.rows.length !== validatedSubjectIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more selected subjects are invalid.'
                });
            }
        }

        client = await pool.connect();

        const passwordHash = await bcrypt.hash(password, 12);

        await client.query('BEGIN');

        // Create the main user account
        const userResult = await client.query(
            `INSERT INTO users (full_name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, full_name, email`,
            [fullName.trim(), normalizedEmail, passwordHash]
        );

        const user = userResult.rows[0];

        // Create student profile
        if (hasStudentProfile) {
            await client.query(
                `INSERT INTO students
                 (user_id, education_level, learning_goals)
                 VALUES ($1, $2, $3)`,
                [
                    user.id,
                    educationLevel.trim(),
                    learningGoals.trim()
                ]
            );
        }

        // Create tutor profile
        if (hasTutorProfile) {
            await client.query(
                `INSERT INTO tutors
                 (user_id, qualification, experience_years, hourly_rate, bio)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    user.id,
                    validatedQualification,
                    validatedExperienceYears,
                    validatedHourlyRate,
                    validatedBio
                ]
            );

            // Assign all selected subjects to the tutor
            await client.query(
                `INSERT INTO tutor_subjects (tutor_id, subject_id)
                 SELECT $1, selected.subject_id
                 FROM UNNEST($2::bigint[]) AS selected(subject_id)`,
                [user.id, validatedSubjectIds]
            );
        }

        // Commit all registration records together
        await client.query('COMMIT');

        const roles = [];

        if (hasStudentProfile) roles.push('student');
        if (hasTutorProfile) roles.push('tutor');

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                roles
            }
        });

    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError.message);
            }
        }

        console.error('Registration error:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Registration failed.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});


// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured.');
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Retrieve every profile associated with this account
        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.password_hash,
                ARRAY_REMOVE(
                    ARRAY[
                        CASE WHEN st.user_id IS NOT NULL THEN 'student' END,
                        CASE WHEN t.user_id IS NOT NULL THEN 'tutor' END
                    ],
                    NULL
                ) AS roles
            FROM users u
            LEFT JOIN students st ON st.user_id = u.id
            LEFT JOIN tutors t ON t.user_id = u.id
            WHERE u.email = $1;
        `;

        const result = await pool.query(query, [normalizedEmail]);

        if (result.rows.length === 0 || result.rows[0].roles.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // JWT identifies the account, not a single role
        const token = jwt.sign(
            {
                sub: String(user.id)
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        // Set the authentication cookie
        res.cookie('token', token, getCookieOptions());

        // Generate and set a session-bound CSRF cookie
        const csrfToken = generateCsrfToken(token);

        res.cookie(
            'csrfToken',
            csrfToken,
            getCsrfCookieOptions()
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                roles: user.roles
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Login failed.'
        });
    }
});

// GET /api/auth/me
// Restore the currently authenticated user's session
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                ARRAY_REMOVE(
                    ARRAY[
                        CASE WHEN st.user_id IS NOT NULL THEN 'student' END,
                        CASE WHEN t.user_id IS NOT NULL THEN 'tutor' END
                    ],
                    NULL
                ) AS roles
            FROM users u
            LEFT JOIN students st ON st.user_id = u.id
            LEFT JOIN tutors t ON t.user_id = u.id
            WHERE u.id = $1;
        `;

        const result = await pool.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            return res.status(401).json({
                success: false,
                message: 'User account not found.'
            });
        }

        const user = result.rows[0];

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                roles: user.roles
            }
        });

    } catch (error) {
        console.error('Session restoration error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Could not restore session.'
        });
    }
});

// GET /api/auth/csrf
// Refresh the CSRF cookie for the current authenticated session
router.get('/csrf', authenticateToken, (req, res) => {
    try {
        const authToken = req.cookies?.token;

        const csrfToken = generateCsrfToken(authToken);

        res.cookie(
            'csrfToken',
            csrfToken,
            getCsrfCookieOptions()
        );

        return res.status(200).json({
            success: true,
            message: 'CSRF token refreshed.'
        });

    } catch (error) {
        console.error('CSRF token generation error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Could not refresh CSRF token.'
        });
    }
});

// POST /api/auth/logout
router.post(
    '/logout',
    authenticateToken,
    csrfProtection,
    (req, res) => {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        res.clearCookie('csrfToken', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    }
);

export default router;
