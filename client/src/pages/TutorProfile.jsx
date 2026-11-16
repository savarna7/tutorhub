
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getTutorById } from '../services/tutorService';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';

// Get the current local date and time in datetime-local format
function getLocalDateTime() {
    const now = new Date();

    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    return now.toISOString().slice(0, 16);
}

function TutorProfile() {
    const { tutorId } = useParams();

    const { user, loading: authLoading } = useAuth();

    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Booking form state
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [sessionStart, setSessionStart] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('60');

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');

    const minDateTime = getLocalDateTime();

    const isStudent = user?.roles?.includes('student');

    useEffect(() => {
        const fetchTutor = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await getTutorById(tutorId);

                setTutor(data);

                setSelectedSubjectId(
                    String(data.subjects[0]?.id || '')
                );
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTutor();
    }, [tutorId]);

    const handleBookingSubmit = async (event) => {
        event.preventDefault();

        setBookingError('');
        setBookingSuccess('');

        if (!selectedSubjectId || !sessionStart) {
            setBookingError('Please complete all booking fields.');
            return;
        }

        try {
            setBookingLoading(true);

            // Convert local browser time into an ISO date with timezone
            const sessionStartISO = new Date(sessionStart).toISOString();

            const data = await createBooking({
                tutorId: tutor.tutor_id,
                subjectId: Number(selectedSubjectId),
                sessionStart: sessionStartISO,
                durationMinutes: Number(durationMinutes)
            });

            setBookingSuccess(data.message);

            // Clear the date and time after successful booking
            setSessionStart('');

        } catch (err) {
            setBookingError(err.message);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="tutor-profile-page">
                <p>Loading tutor profile...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="tutor-profile-page">
                <p className="profile-error">{error}</p>
                <Link to="/tutors">Back to all tutors</Link>
            </main>
        );
    }

    if (!tutor) {
        return null;
    }

    const hourlyRate = Number(tutor.hourly_rate);
    const estimatedPrice =
        hourlyRate * Number(durationMinutes) / 60;

    return (
        <main className="tutor-profile-page">
            <Link to="/tutors" className="back-link">
                ← Back to tutors
            </Link>

            <section className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {tutor.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <p className="profile-eyebrow">TUTOR PROFILE</p>
                        <h1>{tutor.full_name}</h1>

                        <p className="profile-qualification">
                            {tutor.qualification ||
                                'Qualification not provided'}
                        </p>
                    </div>
                </div>

                <div className="profile-stats">
                    <div>
                        <strong>
                            {Number(tutor.experience_years)} years
                        </strong>
                        <span>Teaching experience</span>
                    </div>

                    <div>
                        <strong>
                            ₹{hourlyRate.toLocaleString('en-IN')}
                        </strong>
                        <span>Hourly rate</span>
                    </div>

                    <div>
                        <strong>{tutor.subjects.length}</strong>
                        <span>Subjects taught</span>
                    </div>
                </div>

                <div className="profile-section">
                    <h2>About the tutor</h2>

                    <p>
                        {tutor.bio || 'No introduction provided yet.'}
                    </p>
                </div>

                <div className="profile-section">
                    <h2>Subjects offered</h2>

                    <div className="tutor-subjects">
                        {tutor.subjects.map((subject) => (
                            <span key={subject.id}>
                                {subject.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Booking section */}
                <div className="profile-section booking-section">
                    <h2>Book a session</h2>

                    <p className="booking-description">
                        Schedule a learning session with {tutor.full_name}.
                    </p>

                    {authLoading ? (
                        <p>Checking your account...</p>
                    ) : !user ? (
                        <div className="booking-login-message">
                            <p>
                                Please log in with a student account
                                to book this tutor.
                            </p>

                            <Link to="/login" className="booking-login-link">
                                Log in to continue
                            </Link>
                        </div>
                    ) : !isStudent ? (
                        <p className="booking-description">
                            You need a student profile to book sessions.
                            You can use an account with both student
                            and tutor roles.
                        </p>
                    ) : (
                        <form
                            className="booking-form"
                            onSubmit={handleBookingSubmit}
                        >
                            <div className="booking-field">
                                <label htmlFor="booking-subject">
                                    Select subject
                                </label>

                                <select
                                    id="booking-subject"
                                    value={selectedSubjectId}
                                    onChange={(event) =>
                                        setSelectedSubjectId(event.target.value)
                                    }
                                    required
                                >
                                    {tutor.subjects.map((subject) => (
                                        <option
                                            key={subject.id}
                                            value={subject.id}
                                        >
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="booking-field">
                                <label htmlFor="booking-date">
                                    Select date and time
                                </label>

                                <input
                                    id="booking-date"
                                    type="datetime-local"
                                    min={minDateTime}
                                    value={sessionStart}
                                    onChange={(event) =>
                                        setSessionStart(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="booking-field">
                                <label htmlFor="booking-duration">
                                    Session duration
                                </label>

                                <select
                                    id="booking-duration"
                                    value={durationMinutes}
                                    onChange={(event) =>
                                        setDurationMinutes(event.target.value)
                                    }
                                >
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="90">1.5 hours</option>
                                    <option value="120">2 hours</option>
                                </select>
                            </div>

                            <div className="booking-price">
                                <span>Estimated session price</span>

                                <strong>
                                    ₹{estimatedPrice.toLocaleString('en-IN')}
                                </strong>
                            </div>

                            {bookingError && (
                                <p className="booking-error">
                                    {bookingError}
                                </p>
                            )}

                            {bookingSuccess && (
                                <p className="booking-success">
                                    {bookingSuccess}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="booking-submit-button"
                                disabled={bookingLoading}
                            >
                                {bookingLoading
                                    ? 'Submitting...'
                                    : 'Request Booking'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}

export default TutorProfile;
