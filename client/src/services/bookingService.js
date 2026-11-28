import { getCsrfHeaders } from './csrfService';
import API_BASE_URL from './apiConfig';

const API_URL = `${API_BASE_URL}/bookings`;

// Create a new booking
export const createBooking = async (bookingData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        credentials: 'include',
        body: JSON.stringify(bookingData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking.');
    }

    return data;
};

// Fetch all bookings for the logged-in student
export const getStudentBookings = async (studentId) => {
    const response = await fetch(`${API_URL}/student/${studentId}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch bookings.');
    }

    return data.bookings;
};

// Fetch all bookings for the logged-in tutor
export const getTutorBookings = async (tutorId) => {
    const response = await fetch(`${API_URL}/tutor/${tutorId}`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tutor bookings.');
    }

    return data.bookings;
};


// Update the status of a booking
export const updateBookingStatus = async (bookingId, status) => {
    const response = await fetch(`${API_URL}/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update booking status.');
    }

    return data.booking;
};
