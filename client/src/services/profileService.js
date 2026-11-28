import { getCsrfHeaders } from './csrfService';
import API_BASE_URL from './apiConfig';

const API_URL = `${API_BASE_URL}/profiles`;

// Fetch the logged-in user's complete profile
export const getMyProfile = async () => {
    const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile.');
    }

    return data.profile;
};

// Update basic account details
export const updateAccount = async (accountData) => {
    const response = await fetch(`${API_URL}/account`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        body: JSON.stringify(accountData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update account.');
    }

    return data.account;
};

// Update student profile
export const updateStudentProfile = async (studentData) => {
    const response = await fetch(`${API_URL}/student`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        body: JSON.stringify(studentData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update student profile.');
    }

    return data.student;
};

// Update tutor profile
export const updateTutorProfile = async (tutorData) => {
    const response = await fetch(`${API_URL}/tutor`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        body: JSON.stringify(tutorData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update tutor profile.');
    }

    return data.tutor;
};


// Request an email change
export const requestEmailChange = async (newEmail) => {
    const response = await fetch(`${API_URL}/request-email-change`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        body: JSON.stringify({ newEmail })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to request email change.');
    }

    return data;
};

// Verify the new email address
export const verifyEmailChange = async (token) => {
    const response = await fetch(`${API_URL}/verify-email-change`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Email verification failed.');
    }

    return data;
};
