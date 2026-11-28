
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    render,
    screen,
    waitFor
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { MemoryRouter } from 'react-router-dom';

import TutorDashboard from './TutorDashboard';

import { useAuth } from '../context/useAuth';

import {
    getTutorBookings,
    updateBookingStatus
} from '../services/bookingService';

// Mock authentication context.
vi.mock('../context/useAuth', () => ({
    useAuth: vi.fn()
}));

// Mock booking API calls.
vi.mock('../services/bookingService', () => ({
    getTutorBookings: vi.fn(),
    updateBookingStatus: vi.fn()
}));

const mockBookings = [
    {
        booking_id: 1,
        student_name: 'John Student',
        subject_name: 'Mathematics',
        status: 'pending',
        session_start: '2026-12-01T10:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '500.00'
    },
    {
        booking_id: 2,
        student_name: 'Sarah Student',
        subject_name: 'Physics',
        status: 'confirmed',
        session_start: '2026-12-02T11:00:00',
        session_end: '2026-12-02T12:30:00',
        duration_minutes: 90,
        hourly_rate_at_booking: '800.00'
    },
    {
        booking_id: 3,
        student_name: 'Mike Student',
        subject_name: 'Chemistry',
        status: 'completed',
        session_start: '2026-12-03T12:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '600.00'
    },
    {
        booking_id: 4,
        student_name: 'Alex Student',
        subject_name: 'English',
        status: 'cancelled',
        session_start: '2026-12-04T13:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '400.00'
    },
    {
        booking_id: 5,
        student_name: 'Emma Student',
        subject_name: 'Biology',
        status: 'rejected',
        session_start: '2026-12-05T14:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '700.00'
    }
];

// Render helper.
function renderTutorDashboard() {
    return render(
        <MemoryRouter>
            <TutorDashboard />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
        user: {
            id: 20,
            fullName: 'Test Tutor'
        }
    });

    getTutorBookings.mockResolvedValue(mockBookings);

    updateBookingStatus.mockResolvedValue({
        booking_id: 1,
        status: 'confirmed'
    });
});

describe('TutorDashboard', () => {

    it('should display the loading state', () => {
        getTutorBookings.mockReturnValue(
            new Promise(() => { })
        );

        renderTutorDashboard();

        expect(
            screen.getByText('Loading your bookings...')
        ).toBeInTheDocument();
    });

    it('should display the tutor dashboard correctly', async () => {
        renderTutorDashboard();

        expect(
            await screen.findByRole('heading', {
                name: 'Welcome, Test Tutor!'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByText('TUTOR DASHBOARD')
        ).toBeInTheDocument();

        expect(
            screen.getByRole('heading', {
                name: 'Incoming Bookings'
            })
        ).toBeInTheDocument();
    });

    it('should fetch bookings using the logged-in tutor ID', async () => {
        renderTutorDashboard();

        await waitFor(() => {
            expect(getTutorBookings).toHaveBeenCalledWith(20);
        });
    });

    it('should display all booking details', async () => {
        renderTutorDashboard();

        expect(
            await screen.findByText('John Student')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Mathematics')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Sarah Student')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Physics')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Booking ID: #1')
        ).toBeInTheDocument();

        expect(
            screen.getAllByText('60 minutes')
        ).toHaveLength(4);

        expect(
            screen.getByText('90 minutes')
        ).toBeInTheDocument();
    });

    it('should display booking statistics correctly', async () => {
        renderTutorDashboard();

        await screen.findByText('John Student');

        expect(
            screen.getByText('Total Bookings')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Pending Requests')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Confirmed Sessions')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Cancelled Bookings')
        ).toBeInTheDocument();

        expect(
            screen.getByText('5 shown')
        ).toBeInTheDocument();
    });

    it('should filter pending bookings', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Pending (1)'
            })
        );

        expect(
            screen.getByText('John Student')
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Sarah Student')
        ).not.toBeInTheDocument();

        expect(
            screen.getByText('1 shown')
        ).toBeInTheDocument();
    });

    it('should filter confirmed bookings', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmed (1)'
            })
        );

        expect(
            screen.getByText('Sarah Student')
        ).toBeInTheDocument();

        expect(
            screen.queryByText('John Student')
        ).not.toBeInTheDocument();
    });

    it('should filter completed bookings', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Completed (1)'
            })
        );

        expect(
            screen.getByText('Mike Student')
        ).toBeInTheDocument();

        expect(
            screen.queryByText('John Student')
        ).not.toBeInTheDocument();
    });

    it('should filter cancelled bookings', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Cancelled (1)'
            })
        );

        expect(
            screen.getByText('Alex Student')
        ).toBeInTheDocument();

        expect(
            screen.queryByText('John Student')
        ).not.toBeInTheDocument();
    });

    it('should filter rejected bookings', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Rejected (1)'
            })
        );

        expect(
            screen.getByText('Emma Student')
        ).toBeInTheDocument();

        expect(
            screen.queryByText('John Student')
        ).not.toBeInTheDocument();
    });

    it('should show all bookings when All filter is selected', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Pending (1)'
            })
        );

        await user.click(
            screen.getByRole('button', {
                name: 'All (5)'
            })
        );

        expect(screen.getByText('John Student')).toBeInTheDocument();
        expect(screen.getByText('Sarah Student')).toBeInTheDocument();
        expect(screen.getByText('Mike Student')).toBeInTheDocument();
        expect(screen.getByText('Alex Student')).toBeInTheDocument();
        expect(screen.getByText('Emma Student')).toBeInTheDocument();
    });

    it('should accept a pending booking successfully', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Accept Request'
            })
        );

        expect(updateBookingStatus).toHaveBeenCalledWith(
            1,
            'confirmed'
        );

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Confirmed (2)'
                })
            ).toBeInTheDocument();
        });

        expect(
            screen.getAllByText('confirmed', {
                selector: '.booking-status'
            })
        ).toHaveLength(2);
    });

    it('should reject a pending booking successfully', async () => {
        const user = userEvent.setup();

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Reject Request'
            })
        );

        expect(updateBookingStatus).toHaveBeenCalledWith(
            1,
            'rejected'
        );

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Rejected (2)'
                })
            ).toBeInTheDocument();
        });

        expect(
            screen.getAllByText('rejected', {
                selector: '.booking-status'
            })
        ).toHaveLength(2);
    });


    it('should mark an ended confirmed booking as completed', async () => {
        const user = userEvent.setup();

        updateBookingStatus.mockResolvedValue({
            booking_id: 2,
            status: 'completed'
        });

        // Simulate a session that has already ended.
        getTutorBookings.mockResolvedValue(
            mockBookings.map((booking) =>
                booking.booking_id === 2
                    ? {
                        ...booking,
                        session_end: new Date(
                            Date.now() - 60_000
                        ).toISOString()
                    }
                    : booking
            )
        );

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Mark as Completed'
            })
        );

        expect(updateBookingStatus).toHaveBeenCalledWith(
            2,
            'completed'
        );

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Completed (2)'
                })
            ).toBeInTheDocument();
        });
    });


it('should hide the completion button for a future confirmed booking', async () => {
    renderTutorDashboard();

    await screen.findByText('Sarah Student');

    expect(
        screen.queryByRole('button', {
            name: 'Mark as Completed'
        })
    ).not.toBeInTheDocument();

    expect(
        screen.getByRole('button', {
            name: 'Cancel Session'
        })
    ).toBeInTheDocument();
});



    it('should cancel a confirmed booking successfully', async () => {
        const user = userEvent.setup();

        updateBookingStatus.mockResolvedValue({
            booking_id: 2,
            status: 'cancelled'
        });

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Cancel Session'
            })
        );

        expect(updateBookingStatus).toHaveBeenCalledWith(
            2,
            'cancelled'
        );

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Cancelled (2)'
                })
            ).toBeInTheDocument();
        });
    });

    it('should display an error when a booking action fails', async () => {
        const user = userEvent.setup();

        updateBookingStatus.mockRejectedValue(
            new Error('Failed to update booking')
        );

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Accept Request'
            })
        );

        expect(
            await screen.findByText('Failed to update booking')
        ).toBeInTheDocument();

        expect(
            screen.getByText('pending', {
                selector: '.booking-status'
            })
        ).toBeInTheDocument();
    });

    it('should disable action buttons while updating', async () => {
        const user = userEvent.setup();

        let resolveUpdate;

        updateBookingStatus.mockReturnValue(
            new Promise((resolve) => {
                resolveUpdate = resolve;
            })
        );

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Accept Request'
            })
        );

        const updatingButtons = screen.getAllByRole('button', {
            name: 'Updating...'
        });

        expect(updatingButtons).toHaveLength(2);

        updatingButtons.forEach((button) => {
            expect(button).toBeDisabled();
        });

        resolveUpdate({
            booking_id: 1,
            status: 'confirmed'
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Confirmed (2)'
                })
            ).toBeInTheDocument();
        });
    });

    it('should display an empty state when no bookings exist', async () => {
        getTutorBookings.mockResolvedValue([]);

        renderTutorDashboard();

        expect(
            await screen.findByRole('heading', {
                name: 'No booking requests yet'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'View Tutor Listings'
            })
        ).toHaveAttribute('href', '/tutors');
    });

    it('should display an empty state when a filter has no bookings', async () => {
        const user = userEvent.setup();

        getTutorBookings.mockResolvedValue([
            mockBookings[0]
        ]);

        renderTutorDashboard();

        await screen.findByText('John Student');

        await user.click(
            screen.getByRole('button', {
                name: 'Completed (0)'
            })
        );

        expect(
            screen.getByRole('heading', {
                name: 'No completed bookings'
            })
        ).toBeInTheDocument();
    });

    it('should display an error when fetching bookings fails', async () => {
        getTutorBookings.mockRejectedValue(
            new Error('Failed to fetch tutor bookings')
        );

        renderTutorDashboard();

        expect(
            await screen.findByText(
                'Failed to fetch tutor bookings'
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'Explore tutors'
            })
        ).toHaveAttribute('href', '/tutors');
    });

});
