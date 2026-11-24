
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

import StudentDashboard from './StudentDashboard';

import { useAuth } from '../context/useAuth';

import {
    getStudentBookings,
    updateBookingStatus
} from '../services/bookingService';

// Mock authentication context.
vi.mock('../context/useAuth', () => ({
    useAuth: vi.fn()
}));

// Mock booking API calls.
vi.mock('../services/bookingService', () => ({
    getStudentBookings: vi.fn(),
    updateBookingStatus: vi.fn()
}));

const mockBookings = [
    {
        booking_id: 1,
        tutor_name: 'John Tutor',
        subject_name: 'Mathematics',
        status: 'pending',
        session_start: '2026-12-01T10:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '500.00'
    },
    {
        booking_id: 2,
        tutor_name: 'Sarah Tutor',
        subject_name: 'Physics',
        status: 'confirmed',
        session_start: '2026-12-02T11:00:00',
        duration_minutes: 90,
        hourly_rate_at_booking: '800.00'
    },
    {
        booking_id: 3,
        tutor_name: 'Mike Tutor',
        subject_name: 'Chemistry',
        status: 'completed',
        session_start: '2026-12-03T12:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '600.00'
    },
    {
        booking_id: 4,
        tutor_name: 'Alex Tutor',
        subject_name: 'English',
        status: 'cancelled',
        session_start: '2026-12-04T13:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '400.00'
    },
    {
        booking_id: 5,
        tutor_name: 'Emma Tutor',
        subject_name: 'Biology',
        status: 'rejected',
        session_start: '2026-12-05T14:00:00',
        duration_minutes: 60,
        hourly_rate_at_booking: '700.00'
    }
];

// Render helper.
function renderStudentDashboard() {
    return render(
        <MemoryRouter>
            <StudentDashboard />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
        user: {
            id: 10,
            full_name: 'Test Student'
        }
    });

    getStudentBookings.mockResolvedValue(mockBookings);

    updateBookingStatus.mockResolvedValue({
        booking_id: 1,
        status: 'cancelled'
    });
});

describe('StudentDashboard', () => {

    it('should display the loading state', () => {
        getStudentBookings.mockReturnValue(
            new Promise(() => { })
        );

        renderStudentDashboard();

        expect(
            screen.getByText('Loading your bookings...')
        ).toBeInTheDocument();
    });

    it('should display the student dashboard correctly', async () => {
        renderStudentDashboard();

        expect(
            await screen.findByRole('heading', {
                name: 'Welcome, Test Student!'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('heading', {
                name: 'My Bookings'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'Find Tutors'
            })
        ).toHaveAttribute('href', '/tutors');
    });

    it('should fetch bookings using the logged-in student ID', async () => {
        renderStudentDashboard();

        await waitFor(() => {
            expect(getStudentBookings).toHaveBeenCalledWith(10);
        });
    });


    it('should display all booking details', async () => {
        renderStudentDashboard();

        expect(await screen.findByText('John Tutor')).toBeInTheDocument();
        expect(screen.getByText('Mathematics')).toBeInTheDocument();

        expect(screen.getByText('Sarah Tutor')).toBeInTheDocument();
        expect(screen.getByText('Physics')).toBeInTheDocument();

        expect(screen.getByText('Booking ID: #1')).toBeInTheDocument();

        expect(screen.getAllByText('60 minutes')).toHaveLength(4);
        expect(screen.getByText('90 minutes')).toBeInTheDocument();
    });


    it('should display booking statistics correctly', async () => {
        renderStudentDashboard();

        await screen.findByText('John Tutor');

        expect(screen.getByText('Total Bookings')).toBeInTheDocument();
        expect(screen.getByText('Pending Requests')).toBeInTheDocument();
        expect(screen.getByText('Confirmed Sessions')).toBeInTheDocument();
        expect(screen.getByText('Cancelled Bookings')).toBeInTheDocument();

        expect(screen.getByText('5 shown')).toBeInTheDocument();
    });

    it('should filter pending bookings', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        await user.click(
            screen.getByRole('button', {
                name: 'Pending (1)'
            })
        );

        expect(screen.getByText('John Tutor')).toBeInTheDocument();
        expect(screen.queryByText('Sarah Tutor')).not.toBeInTheDocument();
        expect(screen.getByText('1 shown')).toBeInTheDocument();
    });

    it('should filter confirmed bookings', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        await user.click(
            screen.getByRole('button', {
                name: 'Confirmed (1)'
            })
        );

        expect(screen.getByText('Sarah Tutor')).toBeInTheDocument();
        expect(screen.queryByText('John Tutor')).not.toBeInTheDocument();
    });

    it('should filter completed bookings', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        await user.click(
            screen.getByRole('button', {
                name: 'Completed (1)'
            })
        );

        expect(screen.getByText('Mike Tutor')).toBeInTheDocument();
        expect(screen.queryByText('John Tutor')).not.toBeInTheDocument();
    });

    it('should filter cancelled bookings', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        await user.click(
            screen.getByRole('button', {
                name: 'Cancelled (1)'
            })
        );

        expect(screen.getByText('Alex Tutor')).toBeInTheDocument();
        expect(screen.queryByText('John Tutor')).not.toBeInTheDocument();
    });

    it('should filter rejected bookings', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        await user.click(
            screen.getByRole('button', {
                name: 'Rejected (1)'
            })
        );

        expect(screen.getByText('Emma Tutor')).toBeInTheDocument();
        expect(screen.queryByText('John Tutor')).not.toBeInTheDocument();
    });

    it('should show all bookings when All filter is selected', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

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

        expect(screen.getByText('John Tutor')).toBeInTheDocument();
        expect(screen.getByText('Sarah Tutor')).toBeInTheDocument();
        expect(screen.getByText('Mike Tutor')).toBeInTheDocument();
        expect(screen.getByText('Alex Tutor')).toBeInTheDocument();
        expect(screen.getByText('Emma Tutor')).toBeInTheDocument();
    });

    it('should cancel a pending booking successfully', async () => {
        const user = userEvent.setup();

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        const cancelButtons = screen.getAllByRole('button', {
            name: 'Cancel Booking'
        });

        await user.click(cancelButtons[0]);

        expect(updateBookingStatus).toHaveBeenCalledWith(1, 'cancelled');

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Cancelled (2)'
                })
            ).toBeInTheDocument();
        });
    });

    it('should display an error when cancelling a booking fails', async () => {
        const user = userEvent.setup();

        updateBookingStatus.mockRejectedValue(
            new Error('Failed to cancel booking')
        );

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        const cancelButtons = screen.getAllByRole('button', {
            name: 'Cancel Booking'
        });

        await user.click(cancelButtons[0]);

        expect(
            await screen.findByText('Failed to cancel booking')
        ).toBeInTheDocument();

        expect(
            screen.getByText('pending', {
                selector: '.booking-status'
            })
        ).toBeInTheDocument();
    });

    it('should disable booking action buttons while updating', async () => {
        const user = userEvent.setup();

        let resolveUpdate;

        updateBookingStatus.mockReturnValue(
            new Promise((resolve) => {
                resolveUpdate = resolve;
            })
        );

        renderStudentDashboard();

        await screen.findByText('John Tutor');

        await user.click(
            screen.getAllByRole('button', {
                name: 'Cancel Booking'
            })[0]
        );

        expect(
            screen.getByRole('button', {
                name: 'Updating...'
            })
        ).toBeDisabled();

        resolveUpdate({
            booking_id: 1,
            status: 'cancelled'
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Cancelled (2)'
                })
            ).toBeInTheDocument();
        });
    });

    it('should display an empty state when no bookings exist', async () => {
        getStudentBookings.mockResolvedValue([]);

        renderStudentDashboard();

        expect(
            await screen.findByRole('heading', {
                name: 'No bookings yet'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'Explore Tutors'
            })
        ).toHaveAttribute('href', '/tutors');
    });

    it('should display an empty state when a filter has no bookings', async () => {
        const user = userEvent.setup();

        getStudentBookings.mockResolvedValue([
            mockBookings[0]
        ]);

        renderStudentDashboard();

        await screen.findByText('John Tutor');

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
        getStudentBookings.mockRejectedValue(
            new Error('Failed to fetch student bookings')
        );

        renderStudentDashboard();

        expect(
            await screen.findByText(
                'Failed to fetch student bookings'
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'Explore tutors'
            })
        ).toHaveAttribute('href', '/tutors');
    });

});
