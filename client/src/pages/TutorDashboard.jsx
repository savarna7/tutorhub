
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import {
    getTutorBookings,
    updateBookingStatus
} from '../services/bookingService';

function TutorDashboard() {
    const { user } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingBookingId, setUpdatingBookingId] = useState(null);
    const [actionError, setActionError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await getTutorBookings(user.id);
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

    const filteredBookings = bookings.filter((booking) => {
        if (activeFilter === 'all') {
            return true;
        }

        return booking.status === activeFilter;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

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
                    <p className="profile-eyebrow">TUTOR DASHBOARD</p>
                    <h1>Welcome, {user.full_name}!</h1>
                    <p>Manage your student booking requests.</p>
                </div>
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
                    <h2>Incoming Bookings</h2>
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
                        className={activeFilter === 'cancelled' ? 'active' : ''}
                        onClick={() => setActiveFilter('cancelled')}
                    >
                        Cancelled ({cancelledCount})
                    </button>
                </div>

                {bookings.length === 0 ? (
                    <div className="empty-bookings">
                        <h3>No booking requests yet</h3>
                        <p>
                            Your student booking requests will appear here.
                        </p>

                        <Link to="/tutors" className="explore-tutors-link">
                            View Tutor Listings
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
                                        <h3>{booking.student_name}</h3>
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
                                        <span>Session amount</span>
                                        <strong>
                                            ₹{getSessionPrice(booking).toLocaleString('en-IN')}
                                        </strong>
                                    </div>
                                </div>

                                <div className="booking-card-footer">
                                    Booking ID: #{booking.booking_id}
                                </div>

                                {booking.status === 'pending' && (
                                    <div className="booking-actions">
                                        <button
                                            className="accept-booking-button"
                                            onClick={() =>
                                                handleBookingAction(
                                                    booking.booking_id,
                                                    'confirmed'
                                                )
                                            }
                                            disabled={updatingBookingId !== null}
                                        >
                                            {updatingBookingId === booking.booking_id
                                                ? 'Updating...'
                                                : 'Accept Request'}
                                        </button>

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
                                                : 'Reject Request'}
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

export default TutorDashboard;
