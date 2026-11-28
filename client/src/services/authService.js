import { getCsrfHeaders } from './csrfService';
import API_BASE_URL from './apiConfig';

const API_URL = `${API_BASE_URL}/auth`;

// Register a new account
export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
    }

    return data;
};

// Log in an existing account
export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
    }

    return data;
};

// Restore the current user's session
export const getCurrentUser = async () => {
    const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Could not restore session.');
    }

    return data;
};

// Refresh the CSRF token for the current authenticated session
export const refreshCsrfToken = async () => {
    const response = await fetch(`${API_URL}/csrf`, {
        method: 'GET',
        credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Could not refresh security token.');
    }

    return data;
};

// Log out and clear the authentication and CSRF cookies
export const logoutUser = async () => {
    const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...getCsrfHeaders()
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Logout failed.');
    }

    return data;
};