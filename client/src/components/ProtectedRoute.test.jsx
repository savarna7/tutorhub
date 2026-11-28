
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    render,
    screen
} from '@testing-library/react';

import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from '../context/AuthProvider';
import ProtectedRoute from './ProtectedRoute';

import {
    getCurrentUser,
    refreshCsrfToken
} from '../services/authService';

// Mock authentication API calls.
vi.mock('../services/authService', () => ({
    getCurrentUser: vi.fn(),
    logoutUser: vi.fn(),
    refreshCsrfToken: vi.fn()
}));

vi.mock('../services/csrfService', () => ({
    getCsrfToken: vi.fn(() => 'test-csrf-token'),
    getCsrfHeaders: vi.fn(() => ({
        'X-CSRF-Token': 'test-csrf-token'
    }))
}));

beforeEach(() => {
    getCurrentUser.mockResolvedValue({
        user: null
    });

    refreshCsrfToken.mockResolvedValue({
        success: true
    });
});

function renderProtectedRoute({
    user,
    allowedRole,
    initialEntry = '/protected',
    pendingSession = false
}) {
    if (pendingSession) {
        getCurrentUser.mockReturnValue(new Promise(() => {}));
    } else {
        getCurrentUser.mockResolvedValue({ user });
    }

    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/" element={<p>Home page</p>} />

                    <Route path="/login" element={<p>Login page</p>} />

                    <Route
                        path="/protected"
                        element={<ProtectedRoute allowedRole={allowedRole} />}
                    >
                        <Route
                            index
                            element={<p>Protected content</p>}
                        />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

describe('ProtectedRoute', () => {

it('should display a loading message while restoring the session', () => {
    renderProtectedRoute({
        allowedRole: 'student',
        pendingSession: true
    });

    expect(
        screen.getByText('Checking your session...')
    ).toBeInTheDocument();
});

    it('should redirect unauthenticated users to the login page', async () => {
        renderProtectedRoute({
            user: null,
            allowedRole: 'student'
        });

        expect(
            await screen.findByText('Login page')
        ).toBeInTheDocument();
    });

    it('should allow a student to access a student route', async () => {
        renderProtectedRoute({
            user: {
                id: 1,
                full_name: 'Test Student',
                roles: ['student']
            },
            allowedRole: 'student'
        });

        expect(
            await screen.findByText('Protected content')
        ).toBeInTheDocument();
    });

    it('should redirect a student away from a tutor-only route', async () => {
        renderProtectedRoute({
            user: {
                id: 1,
                full_name: 'Test Student',
                roles: ['student']
            },
            allowedRole: 'tutor'
        });

        expect(
            await screen.findByText('Home page')
        ).toBeInTheDocument();
    });

    it('should allow a tutor to access a tutor route', async () => {
        renderProtectedRoute({
            user: {
                id: 2,
                full_name: 'Test Tutor',
                roles: ['tutor']
            },
            allowedRole: 'tutor'
        });

        expect(
            await screen.findByText('Protected content')
        ).toBeInTheDocument();
    });

    it('should allow a dual-role user to access both role routes', async () => {
        const user = {
            id: 3,
            full_name: 'Test Both',
            roles: ['student', 'tutor']
        };

        const { unmount } = renderProtectedRoute({
            user,
            allowedRole: 'student'
        });

        expect(
            await screen.findByText('Protected content')
        ).toBeInTheDocument();

        // Unmount before testing the tutor route.
        unmount();

        renderProtectedRoute({
            user,
            allowedRole: 'tutor'
        });

        expect(
            await screen.findByText('Protected content')
        ).toBeInTheDocument();
    });

});
