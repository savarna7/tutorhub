
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import {
    getStudentBookings,
    updateBookingStatus
} from '../services/bookingService';

function StudentDashboard() {
    const { user } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [updatingBookingId, setUpdatingBookingId] = useState(null);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await getStudentBookings(user.id);
                setBookings(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user.id]);

    const pendingCount = bookings.filter(
        (booking) => booking.status === 'pending'
    ).length;

    const confirmedCount = bookings.filter(
        (booking) => booking.status === 'confirmed'
    ).length;

    const cancelledCount = bookings.filter(
        (booking) => booking.status === 'cancelled'
    ).length;

    const rejectedCount = bookings.filter(
        (booking) => booking.status === 'rejected'
    ).length;

    const completedCount = bookings.filter(
        (booking) => booking.status === 'completed'
    ).length;

    const filteredBookings = bookings.filter((booking) => {
        if (activeFilter === 'all') {
            return true;
        }

        return booking.status === activeFilter;
    });

    const getSessionPrice = (booking) => {
        return (
            Number(booking.hourly_rate_at_booking) *
            Number(booking.duration_minutes) / 60
        );
    };

    const handleBookingAction = async (bookingId, status) => {
        try {
            setUpdatingBookingId(bookingId);
            setActionError('');

            await updateBookingStatus(bookingId, status);

            setBookings((currentBookings) =>
                currentBookings.map((booking) =>
                    booking.booking_id === bookingId
                        ? { ...booking, status }
                        : booking
                )
            );
        } catch (err) {
            setActionError(err.message);
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (loading) {
        return (
            <main className="dashboard-page">
                <p>Loading your bookings...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="dashboard-page">
                <p className="booking-error">{error}</p>
                <Link to="/tutors">Explore tutors</Link>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <div className="dashboard-heading">
                <div>
                    <p className="profile-eyebrow">STUDENT DASHBOARD</p>
                    <h1>Welcome, {user.full_name}!</h1>
                    <p>Manage your learning sessions in one place.</p>
                </div>

                <Link to="/tutors" className="explore-tutors-link">
                    Find Tutors
                </Link>
            </div>

            <section className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <span>Total Bookings</span>
                    <strong>{bookings.length}</strong>
                </div>

                <div className="dashboard-stat-card">
                    <span>Pending Requests</span>
                    <strong>{pendingCount}</strong>
                </div>

                <div className="dashboard-stat-card">
                    <span>Confirmed Sessions</span>
                    <strong>{confirmedCount}</strong>
                </div>

                <div className="dashboard-stat-card">
                    <span>Cancelled Bookings</span>
                    <strong>{cancelledCount}</strong>
                </div>
            </section>

            <section className="dashboard-bookings">
                <div className="dashboard-section-heading">
                    <h2>My Bookings</h2>
                    <span>{filteredBookings.length} shown</span>
                </div>

                {actionError && (
                    <p className="booking-error">{actionError}</p>
                )}

                <div className="booking-filters">
                    <button
                        className={activeFilter === 'all' ? 'active' : ''}
                        onClick={() => setActiveFilter('all')}
                    >
                        All ({bookings.length})
                    </button>

                    <button
                        className={activeFilter === 'pending' ? 'active' : ''}
                        onClick={() => setActiveFilter('pending')}
                    >
                        Pending ({pendingCount})
                    </button>

                    <button
                        className={activeFilter === 'confirmed' ? 'active' : ''}
                        onClick={() => setActiveFilter('confirmed')}
                    >
                        Confirmed ({confirmedCount})
                    </button>

                    <button
                        className={activeFilter === 'completed' ? 'active' : ''}
                        onClick={() => setActiveFilter('completed')}
                    >
                        Completed ({completedCount})
                    </button>

                    <button
                        className={activeFilter === 'cancelled' ? 'active' : ''}
                        onClick={() => setActiveFilter('cancelled')}
                    >
                        Cancelled ({cancelledCount})
                    </button>

                    <button
                        className={activeFilter === 'rejected' ? 'active' : ''}
                        onClick={() => setActiveFilter('rejected')}
                    >
                        Rejected ({rejectedCount})
                    </button>
                </div>

                {bookings.length === 0 ? (
                    <div className="empty-bookings">
                        <h3>No bookings yet</h3>
                        <p>
                            Find a tutor and book your first learning session.
                        </p>

                        <Link to="/tutors" className="explore-tutors-link">
                            Explore Tutors
                        </Link>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="empty-bookings">
                        <h3>No {activeFilter} bookings</h3>
                        <p>
                            You don't have any bookings with this status.
                        </p>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredBookings.map((booking) => (
                            <article
                                className="student-booking-card"
                                key={booking.booking_id}
                            >
                                <div className="booking-card-header">
                                    <div>
                                        <h3>{booking.tutor_name}</h3>
                                        <p>{booking.subject_name}</p>
                                    </div>

                                    <span
                                        className={`booking-status status-${booking.status}`}
                                    >
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="booking-card-details">
                                    <div>
                                        <span>Session date & time</span>
                                        <strong>
                                            {formatDate(booking.session_start)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Duration</span>
                                        <strong>
                                            {booking.duration_minutes} minutes
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Session price</span>
                                        <strong>
                                            ₹{getSessionPrice(booking).toLocaleString('en-IN')}
                                        </strong>
                                    </div>
                                </div>

                                <div className="booking-card-footer">
                                    Booking ID: #{booking.booking_id}
                                </div>
                                {['pending', 'confirmed'].includes(booking.status) && (
                                    <div className="booking-actions">
                                        <button
                                            className="reject-booking-button"
                                            onClick={() =>
                                                handleBookingAction(
                                                    booking.booking_id,
                                                    'cancelled'
                                                )
                                            }
                                            disabled={updatingBookingId !== null}
                                        >
                                            {updatingBookingId === booking.booking_id
                                                ? 'Updating...'
                                                : 'Cancel Booking'}
                                        </button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default StudentDashboard;
