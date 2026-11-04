
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import jwt from 'jsonwebtoken';

const router = express.Router();


// POST /api/auth/register
router.post('/register', async (req, res) => {
    // 1. Validate request body
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
        bio
    } = req.body;

    // 2. Validate name
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

    // 3. Validate email
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

    // 4. Validate password
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

    // 5. Validate role
    if (!['student', 'tutor'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Role must be either student or tutor.'
        });
    }

    // 6. Validate tutor-specific information
    let validatedHourlyRate;
    let validatedExperienceYears = 0;

    if (role === 'tutor') {
        if (
            hourlyRate === undefined ||
            hourlyRate === null ||
            hourlyRate === '' ||
            !Number.isFinite(Number(hourlyRate)) ||
            Number(hourlyRate) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'A valid hourly rate is required for tutors.'
            });
        }

        validatedHourlyRate = Number(hourlyRate);

        if (
            experienceYears !== undefined &&
            (
                !Number.isSafeInteger(Number(experienceYears)) ||
                Number(experienceYears) < 0 ||
                Number(experienceYears) > 60
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Experience must be a whole number between 0 and 60.'
            });
        }

        if (experienceYears !== undefined) {
            validatedExperienceYears = Number(experienceYears);
        }
    }

    let client;

    try {
        // 7. Connect to database
        client = await pool.connect();

        // 8. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 9. Start transaction
        await client.query('BEGIN');

        // 10. Insert user
        const userQuery = `
            INSERT INTO users (full_name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, full_name, email, created_at;
        `;

        const userResult = await client.query(userQuery, [
            fullName.trim(),
            normalizedEmail,
            passwordHash
        ]);

        const user = userResult.rows[0];

        // 11. Create student or tutor profile
        if (role === 'student') {
            await client.query(
                `INSERT INTO students
                 (user_id, education_level, learning_goals)
                 VALUES ($1, $2, $3)`,
                [user.id, educationLevel || null, learningGoals || null]
            );
        } else {
            await client.query(
                `INSERT INTO tutors
                 (user_id, qualification, experience_years, hourly_rate, bio)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    user.id,
                    qualification || null,
                    validatedExperienceYears,
                    validatedHourlyRate,
                    bio || null
                ]
            );
        }

        // 12. Commit transaction
        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role
            }
        });

    } catch (error) {
        // Roll back only if a database transaction was started
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
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
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

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Find the user and determine their role
        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.password_hash,
                CASE
                    WHEN st.user_id IS NOT NULL THEN 'student'
                    WHEN t.user_id IS NOT NULL THEN 'tutor'
                END AS role
            FROM users u
            LEFT JOIN students st ON st.user_id = u.id
            LEFT JOIN tutors t ON t.user_id = u.id
            WHERE u.email = $1;
        `;

        const result = await pool.query(query, [normalizedEmail]);

        // 3. Check whether the account exists
        if (result.rows.length === 0 || !result.rows[0].role) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];

        // 4. Compare submitted password with stored hash
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

        // 5. Check JWT configuration
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured.');
        }

        // 6. Generate JWT
        const token = jwt.sign(
            {
                sub: String(user.id),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        // 7. Return token and user details
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
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


export default router;
