import csrfProtection from '../middleware/csrfMiddleware.js';
import express from 'express';
import pool from '../db/pool.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all bookings for a particular student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        // A user can only access their own student bookings
        if (String(req.user.id) !== String(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access these bookings.'
            });
        }

        // Verify that the logged-in user has a student profile
        const profile = await pool.query(
            'SELECT 1 FROM students WHERE user_id = $1',
            [studentId]
        );

        if (profile.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: 'A student profile is required to access these bookings.'
            });
        }

        const query = `
            SELECT
                b.id AS booking_id,
                tutor_user.full_name AS tutor_name,
                s.name AS subject_name,
                b.session_start,
                b.session_end,
                b.duration_minutes,
                b.hourly_rate_at_booking,
                b.status
            FROM bookings b
            JOIN tutors t
                ON b.tutor_id = t.user_id
            JOIN users tutor_user
                ON t.user_id = tutor_user.id
            JOIN subjects s
                ON b.subject_id = s.id
            WHERE b.student_id = $1
            ORDER BY b.session_start;
        `;

        const result = await pool.query(query, [studentId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            bookings: result.rows
        });

    } catch (error) {
        console.error('Error fetching student bookings:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings.'
        });
    }
});


// GET all bookings for a particular tutor
router.get('/tutor/:tutorId', authenticateToken, async (req, res) => {
    try {
        const { tutorId } = req.params;

        // A user can only access their own tutor bookings
        if (String(req.user.id) !== String(tutorId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access these bookings.'
            });
        }

        // Verify that the logged-in user has a tutor profile
        const profile = await pool.query(
            'SELECT 1 FROM tutors WHERE user_id = $1',
            [tutorId]
        );

        if (profile.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: 'A tutor profile is required to access these bookings.'
            });
        }

        const query = `
            SELECT
                b.id AS booking_id,
                student_user.full_name AS student_name,
                s.name AS subject_name,
                b.session_start,
                b.session_end,
                b.duration_minutes,
                b.hourly_rate_at_booking,
                b.status
            FROM bookings b
            JOIN students st
                ON b.student_id = st.user_id
            JOIN users student_user
                ON st.user_id = student_user.id
            JOIN subjects s
                ON b.subject_id = s.id
            WHERE b.tutor_id = $1
            ORDER BY b.session_start;
        `;

        const result = await pool.query(query, [tutorId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            bookings: result.rows
        });

    } catch (error) {
        console.error('Error fetching tutor bookings:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings.'
        });
    }
});



// PATCH the status of a booking
router.patch('/:bookingId/status', authenticateToken, csrfProtection, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body || {};

        // Validate booking ID
        if (
            !/^[1-9]\d*$/.test(bookingId) ||
            !Number.isSafeInteger(Number(bookingId))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID.'
            });
        }

        // Validate requested status
        const allowedStatuses = [
            'confirmed',
            'rejected',
            'cancelled',
            'completed'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking status.'
            });
        }

        /*
         * Allowed transitions:
         *
         * Tutor:
         * pending   -> confirmed
         * pending   -> rejected
         * confirmed -> cancelled
         * confirmed -> completed (only after session_end)
         *
         * Student:
         * pending   -> cancelled
         * confirmed -> cancelled
         */

        const query = `
            UPDATE bookings
            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND (
                    (
                        tutor_id = $3
                        AND (
                            (status = 'pending'
                                AND $1 IN ('confirmed', 'rejected'))
                            OR
                            (status = 'confirmed'
                                AND $1 IN ('cancelled', 'completed')
                                AND (
                                    $1 <> 'completed'
                                    OR session_end <= CURRENT_TIMESTAMP
                                ))
                        )
                    )
                    OR
                    (
                        student_id = $3
                        AND status IN ('pending', 'confirmed')
                        AND $1 = 'cancelled'
                    )
              )
            RETURNING id AS booking_id, status;
        `;

        const result = await pool.query(query, [
            status,
            Number(bookingId),
            req.user.id
        ]);

        if (result.rowCount === 0) {
            // Give a specific response for premature completion attempts.
            if (status === 'completed') {
                const bookingCheck = await pool.query(
                    `SELECT session_end > CURRENT_TIMESTAMP AS is_future
                     FROM bookings
                     WHERE id = $1
                       AND tutor_id = $2
                       AND status = 'confirmed'`,
                    [Number(bookingId), req.user.id]
                );

                if (
                    bookingCheck.rowCount > 0 &&
                    bookingCheck.rows[0].is_future
                ) {
                    return res.status(409).json({
                        success: false,
                        message: 'This session cannot be marked as completed before its scheduled end time.'
                    });
                }
            }

            return res.status(404).json({
                success: false,
                message: 'Booking not found or this status transition is not allowed.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Booking ${status} successfully.`,
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating booking status:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to update booking status.'
        });
    }
});





// POST a new booking
router.post('/', authenticateToken, csrfProtection, async (req, res) => {
    try {
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
            tutorId,
            subjectId,
            sessionStart,
            durationMinutes
        } = req.body;

        const studentId = req.user.id;

        // Verify that the logged-in user has a student profile
        const profile = await pool.query(
            'SELECT 1 FROM students WHERE user_id = $1',
            [studentId]
        );

        if (profile.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only users with a student profile can create bookings.'
            });
        }

        // 1. Validate required fields
        if (
            !tutorId ||
            !subjectId ||
            !sessionStart ||
            !durationMinutes
        ) {
            return res.status(400).json({
                success: false,
                message: 'All booking fields are required.'
            });
        }


        // 2. Validate numeric IDs and supported session duration
        const ids = [studentId, tutorId, subjectId];

        const allowedDurations = [30, 60, 90, 120];

        if (
            !ids.every(id =>
                Number.isSafeInteger(Number(id)) && Number(id) > 0
            ) ||
            !allowedDurations.includes(Number(durationMinutes))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID or session duration. Choose 30, 60, 90, or 120 minutes.'
            });
        }



        // 3. Validate the session date
        if (
            typeof sessionStart !== 'string' ||
            Number.isNaN(Date.parse(sessionStart)) ||
            !/(Z|[+-]\d{2}:\d{2})$/i.test(sessionStart)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Provide a valid session date with a timezone.'
            });
        }

        const parsedStart = Date.parse(sessionStart);

        // Prevent bookings in the past
        if (parsedStart <= Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Session date must be in the future.'
            });
        }


        // 4. Insert booking and retrieve the tutor's actual rate
        const query = `
            INSERT INTO bookings (
                student_id,
                tutor_id,
                subject_id,
                session_start,
                session_end,
                duration_minutes,
                hourly_rate_at_booking
            )
            SELECT
                $1,
                t.user_id,
                ts.subject_id,
                $4::TIMESTAMPTZ,
                $4::TIMESTAMPTZ + ($5 * INTERVAL '1 minute'),
                $5,
                t.hourly_rate
            FROM tutors t
            JOIN tutor_subjects ts
                ON t.user_id = ts.tutor_id
            JOIN students st
                ON st.user_id = $1
            WHERE t.user_id = $2
              AND ts.subject_id = $3
            RETURNING id, student_id, tutor_id, subject_id,
                      session_start, session_end,
                      duration_minutes, hourly_rate_at_booking, status;
        `;

        const values = [
            Number(studentId),
            Number(tutorId),
            Number(subjectId),
            sessionStart,
            Number(durationMinutes)
        ];

        const result = await pool.query(query, values);

        // 5. Check whether a matching tutor-subject combination exists
        if (result.rowCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tutor-subject combination not found.'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully!',
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating booking:', error.message);

        // Tutor already has an overlapping booking
        if (error.code === '23P01') {
            return res.status(409).json({
                success: false,
                message: 'Tutor already has a booking during this time.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create booking.'
        });
    }
});


export default router;
