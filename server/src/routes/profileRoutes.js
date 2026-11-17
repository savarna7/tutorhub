
import express from 'express';
import pool from '../db/pool.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { randomBytes, createHash } from 'crypto';
import { sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// GET /api/profiles/me
// Fetch the logged-in user's account and profile information
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,

                st.education_level,
                st.learning_goals,

                t.qualification,
                t.experience_years,
                t.hourly_rate,
                t.bio,

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
            return res.status(404).json({
                success: false,
                message: 'Profile not found.'
            });
        }

        const profile = result.rows[0];

        const subjectsResult = await pool.query(
            `SELECT s.id, s.name
             FROM tutor_subjects ts
             JOIN subjects s ON s.id = ts.subject_id
             WHERE ts.tutor_id = $1
             ORDER BY s.name;`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            profile: {
                ...profile,
                subjects: subjectsResult.rows
            }
        });

    } catch (error) {
        console.error('Fetch profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch profile.'
        });
    }
});



// PUT /api/profiles/tutor
// Update tutor details and selected subjects
router.put('/tutor', authenticateToken, async (req, res) => {
    const {
        qualification,
        experienceYears,
        hourlyRate,
        bio,
        subjectIds
    } = req.body;

    // Validate numeric fields
    const experience = Number(experienceYears);
    const rate = Number(hourlyRate);

    if (
        experienceYears === undefined ||
        experienceYears === null ||
        experienceYears === '' ||
        hourlyRate === undefined ||
        hourlyRate === null ||
        hourlyRate === '' ||
        !Number.isFinite(experience) ||
        !Number.isFinite(rate) ||
        experience < 0 ||
        experience > 60 ||
        Math.abs(experience * 10 - Math.round(experience * 10)) > 0.000001 ||
        rate < 0 ||
        rate > 99999999.99 ||
        Math.abs(rate * 100 - Math.round(rate * 100)) > 0.000001
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide valid experience and hourly rate values.'
        });
    }

    // Validate text fields
    if (
        (qualification != null && typeof qualification !== 'string') ||
        (bio != null && typeof bio !== 'string') ||
        (qualification && qualification.trim().length > 150)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid qualification or bio.'
        });
    }

    // Validate selected subjects
    if (
        !Array.isArray(subjectIds) ||
        subjectIds.length === 0 ||
        !subjectIds.every(
            (id) => Number.isSafeInteger(id) && id > 0
        ) ||
        new Set(subjectIds).size !== subjectIds.length
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please select at least one valid subject.'
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query('BEGIN');

        // Check that the logged-in user has a tutor profile
        const tutorResult = await client.query(
            `SELECT user_id
             FROM tutors
             WHERE user_id = $1
             FOR UPDATE;`,
            [req.user.id]
        );

        if (tutorResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                success: false,
                message: 'Tutor profile not found.'
            });
        }

        // Verify that every selected subject exists
        const subjectsResult = await client.query(
            `SELECT id
             FROM subjects
             WHERE id = ANY($1::bigint[]);`,
            [subjectIds]
        );

        if (subjectsResult.rows.length !== subjectIds.length) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'One or more selected subjects are invalid.'
            });
        }

        // Update tutor details
        const updateResult = await client.query(
            `UPDATE tutors
             SET
                qualification = $1,
                experience_years = $2,
                hourly_rate = $3,
                bio = $4,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $5
             RETURNING
                user_id,
                qualification,
                experience_years,
                hourly_rate,
                bio,
                updated_at;`,
            [
                qualification?.trim() || null,
                experience,
                rate,
                bio?.trim() || null,
                req.user.id
            ]
        );

        // Replace previous subject assignments
        await client.query(
            `DELETE FROM tutor_subjects
             WHERE tutor_id = $1;`,
            [req.user.id]
        );

        await client.query(
            `INSERT INTO tutor_subjects (tutor_id, subject_id)
             SELECT $1, selected.subject_id
             FROM UNNEST($2::bigint[]) AS selected(subject_id);`,
            [req.user.id, subjectIds]
        );

        // Fetch the updated subject list
        const updatedSubjects = await client.query(
            `SELECT s.id, s.name
             FROM tutor_subjects ts
             JOIN subjects s ON s.id = ts.subject_id
             WHERE ts.tutor_id = $1
             ORDER BY s.name;`,
            [req.user.id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Tutor profile updated successfully.',
            tutor: {
                ...updateResult.rows[0],
                subjects: updatedSubjects.rows
            }
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK').catch(() => { });
        }

        console.error('Update tutor profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to update tutor profile.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});



// PUT /api/profiles/student
// Update the logged-in user's student profile
router.put('/student', authenticateToken, async (req, res) => {
    try {
        const { educationLevel, learningGoals } = req.body;

        if (
            (educationLevel != null && typeof educationLevel !== 'string') ||
            (learningGoals != null && typeof learningGoals !== 'string') ||
            (educationLevel && educationLevel.length > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid education level or learning goals.'
            });
        }

        const result = await pool.query(
            `UPDATE students
             SET
                education_level = $1,
                learning_goals = $2,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3
             RETURNING
                user_id,
                education_level,
                learning_goals,
                updated_at;`,
            [
                educationLevel?.trim() || null,
                learningGoals?.trim() || null,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Student profile updated successfully.',
            student: result.rows[0]
        });

    } catch (error) {
        console.error('Update student profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to update student profile.'
        });
    }
});


// PUT /api/profiles/account
// Update the logged-in user's basic account details
router.put('/account', authenticateToken, async (req, res) => {
    try {
        const { fullName, phone } = req.body;

        if (
            typeof fullName !== 'string' ||
            !fullName.trim() ||
            fullName.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required and must not exceed 100 characters.'
            });
        }

        if (
            phone !== undefined &&
            phone !== null &&
            (typeof phone !== 'string' || phone.length > 20)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be a string of at most 20 characters.'
            });
        }

        const result = await pool.query(
            `UPDATE users
             SET
                full_name = $1,
                phone = $2,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, full_name, email, phone, updated_at;`,
            [
                fullName.trim(),
                phone?.trim() || null,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Account details updated successfully.',
            account: result.rows[0]
        });

    } catch (error) {
        console.error('Update account error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to update account details.'
        });
    }
});


// POST /api/profiles/request-email-change
// Request a change to the logged-in user's email address
router.post('/request-email-change', authenticateToken, async (req, res) => {
    const { newEmail } = req.body;

    if (
        typeof newEmail !== 'string' ||
        !newEmail.trim() ||
        newEmail.trim().length > 255
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address.'
        });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address.'
        });
    }

    let client;
    let requestId;
    let verificationToken;

    try {
        client = await pool.connect();

        await client.query('BEGIN');

        // Get the current email address
        const userResult = await client.query(
            'SELECT email FROM users WHERE id = $1;',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        if (userResult.rows[0].email.toLowerCase() === normalizedEmail) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'This is already your current email address.'
            });
        }

        // Check whether another account already uses this email
        const existingEmail = await client.query(
            `SELECT id FROM users
             WHERE LOWER(email) = $1 AND id <> $2;`,
            [normalizedEmail, req.user.id]
        );

        if (existingEmail.rows.length > 0) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                success: false,
                message: 'This email address is already registered.'
            });
        }

        // Check whether another user has a pending request for this email
        const pendingEmail = await client.query(
            `SELECT id FROM email_change_requests
             WHERE LOWER(new_email) = $1
               AND user_id <> $2
               AND used_at IS NULL
               AND expires_at > CURRENT_TIMESTAMP;`,
            [normalizedEmail, req.user.id]
        );

        if (pendingEmail.rows.length > 0) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                success: false,
                message: 'A pending email change already exists for this address.'
            });
        }

        // Invalidate previous unused requests for this user
        await client.query(
            `DELETE FROM email_change_requests
             WHERE user_id = $1 AND used_at IS NULL;`,
            [req.user.id]
        );

        // Generate a cryptographically secure token
        verificationToken = randomBytes(32).toString('hex');

        // Store only the SHA-256 hash in PostgreSQL
        const tokenHash = createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        // Save the request with a 30-minute expiry
        const requestResult = await client.query(
            `INSERT INTO email_change_requests
                (user_id, new_email, token_hash, expires_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
             RETURNING id;`,
            [req.user.id, normalizedEmail, tokenHash]
        );

        requestId = requestResult.rows[0].id;

        await client.query('COMMIT');

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK').catch(() => { });
        }

        console.error('Create email change request error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to create email change request.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }

    // Send the verification email after saving the request
    const verificationUrl =
        `${process.env.CLIENT_URL || 'http://localhost:5173'}` +
        `/verify-email-change?token=${verificationToken}`;

    try {
        await sendVerificationEmail(normalizedEmail, verificationUrl);

        return res.status(200).json({
            success: true,
            message: 'Verification email sent. Please check your new email address.'
        });

    } catch (error) {
        // Remove the pending request if email delivery fails
        await pool.query(
            'DELETE FROM email_change_requests WHERE id = $1;',
            [requestId]
        );

        console.error('Send email verification error:', error.message);

        return res.status(502).json({
            success: false,
            message: 'Could not send verification email. Please try again.'
        });
    }
});


// POST /api/profiles/verify-email-change
// Verify the token and update the user's email address
router.post('/verify-email-change', async (req, res) => {
    const { token } = req.body;

    if (
        typeof token !== 'string' ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid verification link.'
        });
    }

    const tokenHash = createHash('sha256')
        .update(token)
        .digest('hex');

    let client;

    try {
        client = await pool.connect();

        await client.query('BEGIN');

        // Find and lock the pending verification request
        const requestResult = await client.query(
            `SELECT
                ecr.id,
                ecr.user_id,
                ecr.new_email,
                ecr.expires_at,
                ecr.used_at
             FROM email_change_requests ecr
             WHERE ecr.token_hash = $1
             FOR UPDATE;`,
            [tokenHash]
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification link.'
            });
        }

        const emailRequest = requestResult.rows[0];

        if (
            emailRequest.used_at ||
            new Date(emailRequest.expires_at) <= new Date()
        ) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'This verification link has expired or has already been used.'
            });
        }

        // Lock the user account before updating its email
        const userResult = await client.query(
            'SELECT id FROM users WHERE id = $1 FOR UPDATE;',
            [emailRequest.user_id]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        // Update the email address
        const updateResult = await client.query(
            `UPDATE users
             SET email = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, full_name, email;`,
            [emailRequest.new_email, emailRequest.user_id]
        );

        // Mark this verification request as used
        await client.query(
            `UPDATE email_change_requests
             SET used_at = CURRENT_TIMESTAMP
             WHERE id = $1;`,
            [emailRequest.id]
        );

        // Remove any other pending requests belonging to this user
        await client.query(
            `DELETE FROM email_change_requests
             WHERE user_id = $1
               AND id <> $2
               AND used_at IS NULL;`,
            [emailRequest.user_id, emailRequest.id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Your email address has been updated successfully.',
            account: updateResult.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK').catch(() => { });
        }

        console.error('Verify email change error:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'This email address is already registered.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to verify email address.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});


export default router;
