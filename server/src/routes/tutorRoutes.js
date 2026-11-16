import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

// Get all tutors who have at least one assigned subject
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id AS tutor_id,
                u.full_name,
                t.qualification,
                t.experience_years,
                t.hourly_rate,
                t.bio,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', s.id,
                        'name', s.name
                    )
                    ORDER BY s.name
                ) AS subjects
            FROM tutors t
            JOIN users u
                ON t.user_id = u.id
            JOIN tutor_subjects ts
                ON t.user_id = ts.tutor_id
            JOIN subjects s
                ON ts.subject_id = s.id
            GROUP BY
                u.id,
                u.full_name,
                t.qualification,
                t.experience_years,
                t.hourly_rate,
                t.bio
            ORDER BY u.full_name;
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            tutors: result.rows,
        });

    } catch (error) {
        console.error('Error fetching tutors:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch tutors.',
        });
    }
});


// Get an individual tutor's profile
router.get('/:tutorId', async (req, res) => {
    const { tutorId } = req.params;

    // Validate tutor ID
    if (!/^[1-9]\d*$/.test(tutorId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid tutor ID.',
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT
                u.id AS tutor_id,
                u.full_name,
                t.qualification,
                t.experience_years,
                t.hourly_rate,
                t.bio,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', s.id,
                        'name', s.name
                    )
                    ORDER BY s.name
                ) AS subjects
            FROM tutors t
            JOIN users u
                ON t.user_id = u.id
            JOIN tutor_subjects ts
                ON t.user_id = ts.tutor_id
            JOIN subjects s
                ON ts.subject_id = s.id
            WHERE u.id = $1
            GROUP BY
                u.id,
                u.full_name,
                t.qualification,
                t.experience_years,
                t.hourly_rate,
                t.bio;
            `,
            [tutorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tutor not found.',
            });
        }

        res.status(200).json({
            success: true,
            tutor: result.rows[0],
        });

    } catch (error) {
        console.error('Error fetching tutor profile:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch tutor profile.',
        });
    }
});

export default router;