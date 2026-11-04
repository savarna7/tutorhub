
import express from 'express';
import pool from '../db/pool.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all bookings for a particular student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        if (
            req.user.role !== 'student' ||
            req.user.id !== studentId
        ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access these bookings.'
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

        if (
            req.user.role !== 'tutor' ||
            req.user.id !== tutorId
        ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access these bookings.'
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


// POST a new booking
router.post('/', authenticateToken, async (req, res) => {
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

        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can create bookings.'
            });
        }

        const {
            tutorId,
            subjectId,
            sessionStart,
            durationMinutes
        } = req.body;

        const studentId = req.user.id;

        // 1. Validate required fields
        if (
            !studentId ||
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

        // 2. Validate numeric IDs and duration
        const ids = [studentId, tutorId, subjectId];

        if (
            !ids.every(id => Number.isSafeInteger(Number(id)) && Number(id) > 0) ||
            !Number.isSafeInteger(Number(durationMinutes)) ||
            Number(durationMinutes) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID or session duration.'
            });
        }

        // 3. Validate the session date
        const parsedStart = Date.parse(sessionStart);

        if (
            typeof sessionStart !== 'string' ||
            Number.isNaN(parsedStart) ||
            !/(Z|[+-]\d{2}:\d{2})$/i.test(sessionStart)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Provide a valid session date with a timezone.'
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

        // 5. Check whether a matching student/tutor/subject exists
        if (result.rowCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student profile or tutor-subject combination not found.'
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
