import { createHash } from 'node:crypto';
import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
    vi
} from 'vitest';


const { sendVerificationEmailMock } = vi.hoisted(() => ({
    sendVerificationEmailMock: vi.fn()
}));

vi.mock('../src/services/emailService.js', () => ({
    sendVerificationEmail: sendVerificationEmailMock
}));


import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/db/pool.js';

beforeEach(() => {
    sendVerificationEmailMock.mockReset();

    // Simulate successful email delivery by default.
    sendVerificationEmailMock.mockResolvedValue({
        id: 'test-email-id'
    });
});

const testEmails = [
    'vitest.student@tutorhub.local',
    'vitest.tutor@tutorhub.local',
    'vitest.both@tutorhub.local',
    'vitest.duplicate@tutorhub.local',
    'vitest.invalid@tutorhub.local',
    'vitest.email.changed@tutorhub.local'
];

let subjectIds = [];

beforeAll(async () => {
    // Remove leftover bookings associated with test accounts.
    await pool.query(
        `DELETE FROM bookings
         WHERE student_id IN (
             SELECT id FROM users
             WHERE email = ANY($1::text[])
         )
         OR tutor_id IN (
             SELECT id FROM users
             WHERE email = ANY($1::text[])
         )`,
        [testEmails]
    );

    // Remove leftover test accounts.
    await pool.query(
        'DELETE FROM users WHERE email = ANY($1::text[])',
        [testEmails]
    );
    // Seed subjects in the test database.
    const subjects = [
        ['Mathematics', 'Mathematics test subject'],
        ['Physics', 'Physics test subject'],
        ['C Programming', 'Programming test subject']
    ];

    for (const [name, description] of subjects) {
        await pool.query(
            `INSERT INTO subjects (name, description)
             VALUES ($1, $2)
             ON CONFLICT (name) DO NOTHING`,
            [name, description]
        );
    }

    const result = await pool.query(
        `SELECT id
         FROM subjects
         WHERE name = ANY($1::varchar[])
         ORDER BY id`,
        [subjects.map(subject => subject[0])]
    );

    subjectIds = result.rows.map(row => Number(row.id));

    if (subjectIds.length !== subjects.length) {
        throw new Error('Could not prepare test subjects.');
    }
});

describe('TutorHub API', () => {

    it('GET /api/health should return 200', async () => {
        const response = await request(app)
            .get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            'TutorHub backend is running!'
        );
    });

    it('GET /api/db-test should connect to tutorhub_test', async () => {
        const response = await request(app)
            .get('/api/db-test');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.database).toBe('tutorhub_test');
    });

});

describe('User Registration API', () => {

    it('should register a Student successfully', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Vitest Student',
                email: testEmails[0],
                password: 'StudentTest@123',
                role: 'student',
                educationLevel: 'Undergraduate',
                learningGoals: 'Learn programming'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.roles).toEqual(['student']);

        const result = await pool.query(
            `SELECT
                u.id,
                u.password_hash,
                s.user_id AS student_id,
                t.user_id AS tutor_id
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN tutors t ON t.user_id = u.id
             WHERE u.email = $1`,
            [testEmails[0]]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].student_id).not.toBeNull();
        expect(result.rows[0].tutor_id).toBeNull();
        expect(result.rows[0].password_hash).not.toBe(
            'StudentTest@123'
        );
    });

    it('should register a Tutor with selected subjects', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Vitest Tutor',
                email: testEmails[1],
                password: 'TutorTest@123',
                role: 'tutor',
                qualification: 'B.Tech Computer Science',
                experienceYears: 2.5,
                hourlyRate: 500,
                bio: 'I teach programming.',
                subjectIds: subjectIds.slice(0, 2)
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.roles).toEqual(['tutor']);

        const result = await pool.query(
            `SELECT
                u.id,
                t.user_id AS tutor_id,
                s.user_id AS student_id,
                COUNT(ts.subject_id)::int AS subject_count
             FROM users u
             LEFT JOIN tutors t ON t.user_id = u.id
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN tutor_subjects ts ON ts.tutor_id = u.id
             WHERE u.email = $1
             GROUP BY u.id, t.user_id, s.user_id`,
            [testEmails[1]]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].tutor_id).not.toBeNull();
        expect(result.rows[0].student_id).toBeNull();
        expect(result.rows[0].subject_count).toBe(2);
    });

    it('should register a Both-role account successfully', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Vitest Both',
                email: testEmails[2],
                password: 'BothTest@123',
                role: 'both',
                educationLevel: 'Postgraduate',
                learningGoals: 'Improve teaching and learning skills',
                qualification: 'M.Tech Computer Science',
                experienceYears: 3,
                hourlyRate: 700,
                bio: 'I teach mathematics and programming.',
                subjectIds: [subjectIds[0]]
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.roles).toEqual([
            'student',
            'tutor'
        ]);

        const result = await pool.query(
            `SELECT
                u.id,
                s.user_id AS student_id,
                t.user_id AS tutor_id
             FROM users u
             LEFT JOIN students s ON s.user_id = u.id
             LEFT JOIN tutors t ON t.user_id = u.id
             WHERE u.email = $1`,
            [testEmails[2]]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].student_id).not.toBeNull();
        expect(result.rows[0].tutor_id).not.toBeNull();
    });

    it('should reject duplicate email registrations', async () => {
        const payload = {
            fullName: 'Duplicate Test',
            email: testEmails[3],
            password: 'DuplicateTest@123',
            role: 'student',
            educationLevel: 'Undergraduate',
            learningGoals: 'Learn databases'
        };

        const firstResponse = await request(app)
            .post('/api/auth/register')
            .send(payload);

        const secondResponse = await request(app)
            .post('/api/auth/register')
            .send(payload);

        expect(firstResponse.status).toBe(201);
        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.success).toBe(false);

        const result = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [testEmails[3]]
        );

        expect(result.rows).toHaveLength(1);
    });

    it('should reject registration with missing student information', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Invalid Student',
                email: testEmails[4],
                password: 'InvalidTest@123',
                role: 'student',
                educationLevel: 'Undergraduate'
                // learningGoals intentionally missing
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);

        const result = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [testEmails[4]]
        );

        expect(result.rows).toHaveLength(0);
    });

    it('should reject registration with an invalid subject ID', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Invalid Tutor',
                email: 'vitest.invalid.subject@tutorhub.local',
                password: 'InvalidTest@123',
                role: 'tutor',
                qualification: 'B.Tech',
                experienceYears: 2,
                hourlyRate: 500,
                bio: 'Test tutor',
                subjectIds: [99999999]
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);

        const result = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            ['vitest.invalid.subject@tutorhub.local']
        );

        expect(result.rows).toHaveLength(0);
    });

});


describe('User Authentication API', () => {
    const studentEmail = 'vitest.student@tutorhub.local';
    const studentPassword = 'StudentTest@123';

    it('should log in with valid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: studentEmail,
                password: studentPassword
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(studentEmail);
        expect(response.body.user.roles).toEqual(['student']);

        const cookie = response.headers['set-cookie'];

        expect(cookie).toBeDefined();
        expect(cookie.join(';')).toContain('token=');
        expect(cookie.join(';').toLowerCase()).toContain('httponly');
    });

    it('should reject an incorrect password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: studentEmail,
                password: 'WrongPassword@123'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('should reject an unregistered email', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'unknown@tutorhub.local',
                password: 'SomePassword@123'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('should reject login when email or password is missing', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: studentEmail
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should restore the session using the login cookie', async () => {
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: studentEmail,
                password: studentPassword
            });

        expect(loginResponse.status).toBe(200);

        const cookie = loginResponse.headers['set-cookie'][0]
            .split(';')[0];

        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(studentEmail);
        expect(response.body.user.roles).toEqual(['student']);
    });

    it('should reject session restoration without a cookie', async () => {
        const response = await request(app)
            .get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('should log out and clear the authentication cookie', async () => {
        const response = await request(app)
            .post('/api/auth/logout');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const cookie = response.headers['set-cookie'];

        expect(cookie).toBeDefined();
        expect(cookie.join(';')).toContain('token=');
        expect(cookie.join(';').toLowerCase()).toContain('expires=');
    });
});


async function getAuthCookie(email, password) {
    const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    if (response.status !== 200) {
        throw new Error(`Login failed for test account: ${email}`);
    }

    return response.headers['set-cookie'][0].split(';')[0];
}

describe('User Profile API', () => {
    const studentEmail = 'vitest.student@tutorhub.local';
    const tutorEmail = 'vitest.tutor@tutorhub.local';

    it('should fetch the Student profile', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .get('/api/profiles/me')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.profile.email).toBe(studentEmail);
        expect(response.body.profile.roles).toEqual(['student']);
        expect(response.body.profile.subjects).toEqual([]);
    });

    it('should fetch the Tutor profile and assigned subjects', async () => {
        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .get('/api/profiles/me')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.profile.roles).toEqual(['tutor']);
        expect(response.body.profile.subjects).toHaveLength(2);
    });

    it('should reject profile retrieval without authentication', async () => {
        const response = await request(app)
            .get('/api/profiles/me');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('should update Student profile information', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/student')
            .set('Cookie', cookie)
            .send({
                educationLevel: 'Postgraduate',
                learningGoals: 'Master full-stack development through automated testing.'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.student.education_level).toBe(
            'Postgraduate'
        );
        expect(response.body.student.learning_goals).toBe(
            'Master full-stack development through automated testing.'
        );

        // Verify that the changes persist in the database.
        const profileResponse = await request(app)
            .get('/api/profiles/me')
            .set('Cookie', cookie);

        expect(profileResponse.body.profile.education_level).toBe(
            'Postgraduate'
        );
    });

    it('should update Tutor details and assigned subjects', async () => {
        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/tutor')
            .set('Cookie', cookie)
            .send({
                qualification: 'M.Tech Computer Science',
                experienceYears: 4.5,
                hourlyRate: 750,
                bio: 'Automated testing profile update.',
                subjectIds: [subjectIds[2]]
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.tutor.qualification).toBe(
            'M.Tech Computer Science'
        );
        expect(response.body.tutor.subjects).toHaveLength(1);
        expect(Number(response.body.tutor.subjects[0].id)).toBe(
            subjectIds[2]
        );

        // Verify that the changes persist after fetching the profile.
        const profileResponse = await request(app)
            .get('/api/profiles/me')
            .set('Cookie', cookie);

        expect(profileResponse.body.profile.bio).toBe(
            'Automated testing profile update.'
        );
        expect(profileResponse.body.profile.subjects).toHaveLength(1);
    });

    it('should reject invalid Student profile information', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/student')
            .set('Cookie', cookie)
            .send({
                educationLevel: 'A'.repeat(101),
                learningGoals: 'This update should be rejected.'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should reject invalid Tutor subject IDs', async () => {
        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/tutor')
            .set('Cookie', cookie)
            .send({
                qualification: 'B.Tech',
                experienceYears: 2,
                hourlyRate: 500,
                bio: 'Invalid subject test.',
                subjectIds: [99999999]
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
    it('should reject tutor profile updates with a missing request body', async () => {
        const cookie = await getAuthCookie(
            'vitest.tutor@tutorhub.local',
            'TutorTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/tutor')
            .set('Cookie', cookie);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
    it('should reject learning goals longer than 1000 characters', async () => {
    const cookie = await getAuthCookie(
        'vitest.student@tutorhub.local',
        'StudentTest@123'
    );

    const response = await request(app)
        .put('/api/profiles/student')
        .set('Cookie', cookie)
        .send({
            educationLevel: 'College',
            learningGoals: 'A'.repeat(1001)
        });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
});
it('should reject tutor bios longer than 1000 characters', async () => {
    const cookie = await getAuthCookie(
        'vitest.tutor@tutorhub.local',
        'TutorTest@123'
    );

    const response = await request(app)
        .put('/api/profiles/tutor')
        .set('Cookie', cookie)
        .send({
            qualification: 'B.Tech',
            experienceYears: 2,
            hourlyRate: 500,
            bio: 'A'.repeat(1001),
            subjectIds: [1]
        });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
});
});


describe('Account Management API', () => {
    const studentEmail = 'vitest.student@tutorhub.local';

    it('should update the account name and phone number', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/account')
            .set('Cookie', cookie)
            .send({
                fullName: 'Updated Vitest Student',
                phone: '9876543210'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.account.full_name).toBe(
            'Updated Vitest Student'
        );
        expect(response.body.account.phone).toBe('9876543210');

        const profile = await request(app)
            .get('/api/profiles/me')
            .set('Cookie', cookie);

        expect(profile.body.profile.full_name).toBe(
            'Updated Vitest Student'
        );
        expect(profile.body.profile.phone).toBe('9876543210');
    });

    it('should reject an empty account name', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/account')
            .set('Cookie', cookie)
            .send({
                fullName: '   ',
                phone: '9876543210'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should reject a phone number longer than 20 characters', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .put('/api/profiles/account')
            .set('Cookie', cookie)
            .send({
                fullName: 'Updated Vitest Student',
                phone: '1'.repeat(21)
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should reject account updates without authentication', async () => {
        const response = await request(app)
            .put('/api/profiles/account')
            .send({
                fullName: 'Unauthenticated User',
                phone: '9876543210'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });
});


describe('Booking API', () => {
    const studentEmail = 'vitest.student@tutorhub.local';
    const tutorEmail = 'vitest.tutor@tutorhub.local';

    let studentId;
    let tutorId;
    let bookingId;

    const firstSession = '2030-06-15T10:00:00.000Z';
    const secondSession = '2030-06-15T12:00:00.000Z';


    const createTestBooking = async (sessionStart) => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        return request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart,
                durationMinutes: 60
            });
    };


    beforeAll(async () => {
        const student = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [studentEmail]
        );

        const tutor = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [tutorEmail]
        );

        if (!student.rowCount || !tutor.rowCount) {
            throw new Error('Booking test accounts were not found.');
        }

        studentId = student.rows[0].id;
        tutorId = tutor.rows[0].id;

        // Ensure a clean booking test environment.
        await pool.query(
            'DELETE FROM bookings WHERE student_id = $1 OR tutor_id = $2',
            [studentId, tutorId]
        );
    });

    it('should create a booking successfully', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: firstSession,
                durationMinutes: 60
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.booking.status).toBe('pending');
        expect(response.body.booking.duration_minutes).toBe(60);
        expect(Number(response.body.booking.hourly_rate_at_booking))
            .toBe(750);

        bookingId = response.body.booking.id;
    });

    it('should reject an overlapping booking for the same tutor', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: firstSession,
                durationMinutes: 60
            });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
    });

    it('should allow the student and tutor to view their bookings', async () => {
        const studentCookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const tutorCookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const studentResponse = await request(app)
            .get(`/api/bookings/student/${studentId}`)
            .set('Cookie', studentCookie);

        const tutorResponse = await request(app)
            .get(`/api/bookings/tutor/${tutorId}`)
            .set('Cookie', tutorCookie);

        expect(studentResponse.status).toBe(200);
        expect(studentResponse.body.count).toBe(1);
        expect(studentResponse.body.bookings[0].status).toBe('pending');

        expect(tutorResponse.status).toBe(200);
        expect(tutorResponse.body.count).toBe(1);
        expect(tutorResponse.body.bookings[0].status).toBe('pending');
    });

    it('should prevent users from viewing another role account bookings', async () => {
        const studentCookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const tutorCookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const studentAccess = await request(app)
            .get(`/api/bookings/tutor/${tutorId}`)
            .set('Cookie', studentCookie);

        const tutorAccess = await request(app)
            .get(`/api/bookings/student/${studentId}`)
            .set('Cookie', tutorCookie);

        expect(studentAccess.status).toBe(403);
        expect(tutorAccess.status).toBe(403);
    });

    it('should prevent a student from creating a booking', async () => {
        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: secondSession,
                durationMinutes: 60
            });

        expect(response.status).toBe(403);
    });

    it('should reject a session date without a timezone', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: '2030-06-15T10:00:00',
                durationMinutes: 60
            });

        expect(response.status).toBe(400);
    });

    it('should prevent a student from changing booking status', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${bookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'confirmed' });

        expect(response.status).toBe(404);
    });

    it('should allow the tutor to confirm a pending booking', async () => {
        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${bookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'confirmed' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.booking.status).toBe('confirmed');
    });


    it('should allow the student to cancel a confirmed booking', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${bookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'cancelled' });

        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('cancelled');
    });

    it('should not allow a terminal booking status to be changed', async () => {
        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${bookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'completed' });

        expect(response.status).toBe(404);
    });

    it('should allow the tutor to reject a pending booking', async () => {
        const createResponse = await createTestBooking(
            secondSession
        );

        expect(createResponse.status).toBe(201);

        const secondBookingId = createResponse.body.booking.id;

        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${secondBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'rejected' });

        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('rejected');
    });

    it('should allow the student to cancel a pending booking', async () => {
        const createResponse = await createTestBooking(
            '2030-06-15T14:00:00.000Z'
        );

        expect(createResponse.status).toBe(201);

        const newBookingId = createResponse.body.booking.id;

        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${newBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'cancelled' });

        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('cancelled');
    });

    it('should allow the tutor to cancel a confirmed booking', async () => {
        const createResponse = await createTestBooking(
            '2030-06-15T16:00:00.000Z'
        );

        expect(createResponse.status).toBe(201);

        const newBookingId = createResponse.body.booking.id;

        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const confirmResponse = await request(app)
            .patch(`/api/bookings/${newBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'confirmed' });

        expect(confirmResponse.status).toBe(200);

        const cancelResponse = await request(app)
            .patch(`/api/bookings/${newBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'cancelled' });

        expect(cancelResponse.status).toBe(200);
        expect(cancelResponse.body.booking.status).toBe('cancelled');
    });

    it('should allow the tutor to mark a confirmed booking as completed', async () => {
        const createResponse = await createTestBooking(
            '2030-06-15T18:00:00.000Z'
        );

        expect(createResponse.status).toBe(201);

        const newBookingId = createResponse.body.booking.id;

        const cookie = await getAuthCookie(
            tutorEmail,
            'TutorTest@123'
        );

        const confirmResponse = await request(app)
            .patch(`/api/bookings/${newBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'confirmed' });

        expect(confirmResponse.status).toBe(200);

        const completeResponse = await request(app)
            .patch(`/api/bookings/${newBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'completed' });

        expect(completeResponse.status).toBe(200);
        expect(completeResponse.body.booking.status).toBe('completed');
    });

    it('should not allow a student to reject a pending booking', async () => {
        const createResponse = await createTestBooking(
            '2030-06-15T20:00:00.000Z'
        );

        expect(createResponse.status).toBe(201);

        const newBookingId = createResponse.body.booking.id;

        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${newBookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'rejected' });

        expect(response.status).toBe(404);
    });


    it('should reject a booking with missing required fields', async () => {
        const cookie = await getAuthCookie(
            'vitest.student@tutorhub.local',
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2]
            });

        expect(response.status).toBe(400);
    });

    it('should reject an invalid tutor ID', async () => {
        const cookie = await getAuthCookie(
            'vitest.student@tutorhub.local',
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: 0,
                subjectId: subjectIds[2],
                sessionStart: '2030-06-15T14:00:00.000Z',
                durationMinutes: 60
            });

        expect(response.status).toBe(400);
    });

    it('should reject an invalid session duration', async () => {
        const cookie = await getAuthCookie(
            'vitest.student@tutorhub.local',
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: '2030-06-15T14:00:00.000Z',
                durationMinutes: -30
            });

        expect(response.status).toBe(400);
    });


    it('should reject unsupported session durations', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: '2030-06-16T10:00:00.000Z',
                durationMinutes: 45
            });

        expect(response.status).toBe(400);
    });

    it('should reject a booking with a past session date', async () => {
        const cookie = await getAuthCookie(
            studentEmail,
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[2],
                sessionStart: '2020-06-15T10:00:00.000Z',
                durationMinutes: 60
            });

        expect(response.status).toBe(400);
    });


    it('should reject a subject the tutor does not teach', async () => {
        const cookie = await getAuthCookie(
            'vitest.student@tutorhub.local',
            'StudentTest@123'
        );

        const response = await request(app)
            .post('/api/bookings')
            .set('Cookie', cookie)
            .send({
                tutorId: Number(tutorId),
                subjectId: subjectIds[0],
                sessionStart: '2030-06-15T14:00:00.000Z',
                durationMinutes: 60
            });

        expect(response.status).toBe(400);
    });

    it('should reject an invalid booking ID when updating status', async () => {
        const cookie = await getAuthCookie(
            'vitest.tutor@tutorhub.local',
            'TutorTest@123'
        );

        const response = await request(app)
            .patch('/api/bookings/invalid/status')
            .set('Cookie', cookie)
            .send({ status: 'confirmed' });

        expect(response.status).toBe(400);
    });

    it('should reject an unsupported booking status', async () => {
        const cookie = await getAuthCookie(
            'vitest.tutor@tutorhub.local',
            'TutorTest@123'
        );

        const response = await request(app)
            .patch(`/api/bookings/${bookingId}/status`)
            .set('Cookie', cookie)
            .send({ status: 'pending' });

        expect(response.status).toBe(400);
    });

});


describe('Email Change API', () => {
    const studentEmail = 'vitest.student@tutorhub.local';
    const studentPassword = 'StudentTest@123';

    async function createEmailChangeRequest(newEmail) {
        const cookie = await getAuthCookie(
            studentEmail,
            studentPassword
        );

        return request(app)
            .post('/api/profiles/request-email-change')
            .set('Cookie', cookie)
            .send({ newEmail });
    }

    function getVerificationToken() {
        const verificationUrl = sendVerificationEmailMock.mock.calls[0][1];

        return new URL(verificationUrl).searchParams.get('token');
    }

    it('should reject email change requests without authentication', async () => {
        const response = await request(app)
            .post('/api/profiles/request-email-change')
            .send({ newEmail: 'new.email@example.com' });

        expect(response.status).toBe(401);
    });

    it('should reject invalid email addresses', async () => {
        const invalidEmails = [
            '',
            'invalid-email',
            'missing-domain@',
            'missing-at.example.com',
            'email with spaces@example.com',
            'a'.repeat(250) + '@example.com'
        ];

        for (const newEmail of invalidEmails) {
            const response = await createEmailChangeRequest(newEmail);

            expect(response.status).toBe(400);
        }

        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('should reject a request to use the current email address', async () => {
        const response = await createEmailChangeRequest(studentEmail);

        expect(response.status).toBe(400);
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('should reject an email already registered to another account', async () => {
        const response = await createEmailChangeRequest(
            'vitest.tutor@tutorhub.local'
        );

        expect(response.status).toBe(409);
        expect(sendVerificationEmailMock).not.toHaveBeenCalled();
    });

    it('should create a secure email change request', async () => {
        const newEmail = 'vitest.pending@tutorhub.local';

        const response = await createEmailChangeRequest(newEmail);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
        expect(sendVerificationEmailMock.mock.calls[0][0]).toBe(newEmail);

        const token = getVerificationToken();

        expect(token).toMatch(/^[a-f0-9]{64}$/);

        const tokenHash = createHash('sha256')
            .update(token)
            .digest('hex');

        const result = await pool.query(
            `SELECT token_hash, expires_at
             FROM email_change_requests
             WHERE new_email = $1`,
            [newEmail]
        );

        expect(result.rowCount).toBe(1);
        expect(result.rows[0].token_hash).toBe(tokenHash);
        expect(result.rows[0].token_hash).not.toBe(token);

        const expiryCheck = await pool.query(
            `SELECT
                expires_at > CURRENT_TIMESTAMP AS is_future,
                expires_at <= CURRENT_TIMESTAMP + INTERVAL '31 minutes'
                    AS within_expected_window
             FROM email_change_requests
             WHERE new_email = $1`,
            [newEmail]
        );

        expect(expiryCheck.rows[0].is_future).toBe(true);
        expect(expiryCheck.rows[0].within_expected_window).toBe(true);
    });

    it('should remove the pending request when email delivery fails', async () => {
        const newEmail = 'vitest.delivery.failure@tutorhub.local';

        sendVerificationEmailMock.mockRejectedValueOnce(
            new Error('Simulated email delivery failure')
        );

        const response = await createEmailChangeRequest(newEmail);

        expect(response.status).toBe(502);
        expect(response.body.success).toBe(false);

        const result = await pool.query(
            `SELECT id
             FROM email_change_requests
             WHERE new_email = $1`,
            [newEmail]
        );

        expect(result.rowCount).toBe(0);
    });

    it('should reject an expired verification token', async () => {
        const newEmail = 'vitest.expired@tutorhub.local';

        const response = await createEmailChangeRequest(newEmail);

        expect(response.status).toBe(200);

        const token = getVerificationToken();

        const tokenHash = createHash('sha256')
            .update(token)
            .digest('hex');

        await pool.query(
            `UPDATE email_change_requests
             SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 minute'
             WHERE token_hash = $1`,
            [tokenHash]
        );

        const verificationResponse = await request(app)
            .post('/api/profiles/verify-email-change')
            .send({ token });

        expect(verificationResponse.status).toBe(400);

        const userResult = await pool.query(
            'SELECT email FROM users WHERE email = $1',
            [studentEmail]
        );

        expect(userResult.rowCount).toBe(1);
    });


    it('should reject malformed verification tokens', async () => {
        const invalidTokens = [
            '',
            'short-token',
            'z'.repeat(64),
            'a'.repeat(63),
            null,
            123
        ];

        for (const token of invalidTokens) {
            const response = await request(app)
                .post('/api/profiles/verify-email-change')
                .send({ token });

            expect(response.status).toBe(400);
        }
    });

    it('should prevent another user from reserving an already pending email', async () => {
        const newEmail = 'vitest.reserved@tutorhub.local';

        const tutorCookie = await getAuthCookie(
            'vitest.tutor@tutorhub.local',
            'TutorTest@123'
        );

        // The tutor reserves the new email first.
        const firstResponse = await request(app)
            .post('/api/profiles/request-email-change')
            .set('Cookie', tutorCookie)
            .send({ newEmail });

        expect(firstResponse.status).toBe(200);

        // The student then tries to reserve the same email.
        const secondResponse = await createEmailChangeRequest(newEmail);

        expect(secondResponse.status).toBe(409);
        expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
    });


    it('should prevent two users from reserving the same email concurrently', async () => {
        const newEmail = 'vitest.concurrent@tutorhub.local';

        const studentCookie = await getAuthCookie(
            studentEmail,
            studentPassword
        );

        const tutorCookie = await getAuthCookie(
            'vitest.tutor@tutorhub.local',
            'TutorTest@123'
        );

        // Both users attempt to reserve the same email simultaneously.
        const [studentResponse, tutorResponse] = await Promise.all([
            request(app)
                .post('/api/profiles/request-email-change')
                .set('Cookie', studentCookie)
                .send({ newEmail }),

            request(app)
                .post('/api/profiles/request-email-change')
                .set('Cookie', tutorCookie)
                .send({ newEmail })
        ]);

        const statuses = [
            studentResponse.status,
            tutorResponse.status
        ].sort((a, b) => a - b);

        // Exactly one request should succeed; the other should conflict.
        expect(statuses).toEqual([200, 409]);

        // Only one verification email should be sent.
        expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);

        // Only one pending request should exist for this email.
        const result = await pool.query(
            `SELECT id, user_id, new_email
         FROM email_change_requests
         WHERE new_email = $1
         AND used_at IS NULL`,
            [newEmail]
        );

        expect(result.rowCount).toBe(1);
        expect(result.rows[0].new_email).toBe(newEmail);
    });


    it('should invalidate an older verification link when a newer request is made', async () => {
        const oldEmail = 'vitest.superseded@tutorhub.local';
        const newEmail = 'vitest.replacement@tutorhub.local';

        // First email-change request.
        const firstResponse = await createEmailChangeRequest(oldEmail);
        expect(firstResponse.status).toBe(200);

        const firstVerificationUrl = sendVerificationEmailMock.mock.calls[0][1];
        const oldToken = new URL(firstVerificationUrl).searchParams.get('token');

        expect(oldToken).toBeTruthy();

        // Second request should replace the first pending request.
        const secondResponse = await createEmailChangeRequest(newEmail);
        expect(secondResponse.status).toBe(200);

        const secondVerificationUrl = sendVerificationEmailMock.mock.calls[1][1];
        const newToken = new URL(secondVerificationUrl).searchParams.get('token');

        expect(newToken).toBeTruthy();
        expect(newToken).not.toBe(oldToken);

        // The old verification link must no longer work.
        const oldTokenResponse = await request(app)
            .post('/api/profiles/verify-email-change')
            .send({ token: oldToken });

        expect(oldTokenResponse.status).toBe(400);

        // The newer request should still be pending.
        const pendingRequest = await pool.query(
            `SELECT new_email
         FROM email_change_requests
         WHERE new_email = $1
         AND used_at IS NULL`,
            [newEmail]
        );

        expect(pendingRequest.rows).toHaveLength(1);
        expect(pendingRequest.rows[0].new_email).toBe(newEmail);
    });


    it('should update the email after successful verification and reject token reuse', async () => {
        const newEmail = 'vitest.email.changed@tutorhub.local';

        const requestResponse = await createEmailChangeRequest(newEmail);

        expect(requestResponse.status).toBe(200);

        const token = getVerificationToken();

        const verificationResponse = await request(app)
            .post('/api/profiles/verify-email-change')
            .send({ token });

        expect(verificationResponse.status).toBe(200);
        expect(verificationResponse.body.success).toBe(true);
        expect(verificationResponse.body.account.email).toBe(newEmail);

        const userResult = await pool.query(
            'SELECT email FROM users WHERE email = $1',
            [newEmail]
        );

        expect(userResult.rowCount).toBe(1);

        const requestResult = await pool.query(
            `SELECT used_at
             FROM email_change_requests
             WHERE new_email = $1`,
            [newEmail]
        );

        expect(requestResult.rowCount).toBe(1);
        expect(requestResult.rows[0].used_at).not.toBeNull();

        // A verification token must not be reusable.
        const reuseResponse = await request(app)
            .post('/api/profiles/verify-email-change')
            .send({ token });

        expect(reuseResponse.status).toBe(400);
    });
    it('should reject email verification with a missing request body', async () => {
        const response = await request(app)
            .post('/api/profiles/verify-email-change');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});


afterAll(async () => {
    // Delete bookings associated with test accounts first.
    await pool.query(
        `DELETE FROM bookings
         WHERE student_id IN (
             SELECT id
             FROM users
             WHERE email LIKE 'vitest.%@tutorhub.local'
         )
         OR tutor_id IN (
             SELECT id
             FROM users
             WHERE email LIKE 'vitest.%@tutorhub.local'
         )`
    );

    // Now remove test accounts.
    await pool.query(
        `DELETE FROM users
         WHERE email LIKE 'vitest.%@tutorhub.local'`
    );

    // Close the database connection pool.
    await pool.end();
});