
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

import { useContext, useState } from 'react';

import AuthProvider from './AuthProvider';
import { AuthContext } from './AuthContext';

import {
    getCurrentUser,
    logoutUser,
    refreshCsrfToken
} from '../services/authService';

vi.mock('../services/authService', () => ({
    getCurrentUser: vi.fn(),
    logoutUser: vi.fn(),
    refreshCsrfToken: vi.fn()
}));

function TestConsumer() {
    const {
        user,
        loading,
        isAuthenticated,
        logout
    } = useContext(AuthContext);

    const [logoutError, setLogoutError] = useState('');

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            setLogoutError(error.message);
        }
    };

    if (loading) {
        return <p>Loading session...</p>;
    }

    return (
        <div>
            <p>
                {isAuthenticated
                    ? `Welcome ${user.full_name}`
                    : 'Not authenticated'}
            </p>

            <button onClick={handleLogout}>
                Logout
            </button>

            {logoutError && (
                <p role="alert">{logoutError}</p>
            )}
        </div>
    );
}

function renderAuthProvider() {
    return render(
        <AuthProvider>
            <TestConsumer />
        </AuthProvider>
    );
}

const testUser = {
    id: 1,
    full_name: 'Test Student',
    roles: ['student']
};

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        getCurrentUser.mockResolvedValue({
            user: testUser
        });

        refreshCsrfToken.mockResolvedValue({
            success: true
        });

        logoutUser.mockResolvedValue({
            success: true
        });
    });

    it('should restore the authenticated user on application startup', async () => {
        renderAuthProvider();

        expect(
            await screen.findByText('Welcome Test Student')
        ).toBeInTheDocument();

        expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should refresh the CSRF token after restoring the session', async () => {
        renderAuthProvider();

        await screen.findByText('Welcome Test Student');

        expect(refreshCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('should keep the user authenticated if CSRF refresh fails', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        refreshCsrfToken.mockRejectedValue(
            new Error('CSRF refresh failed')
        );

        renderAuthProvider();

        expect(
            await screen.findByText('Welcome Test Student')
        ).toBeInTheDocument();

        expect(consoleError).toHaveBeenCalled();

        consoleError.mockRestore();
    });

    it('should remain unauthenticated if session restoration fails', async () => {
        getCurrentUser.mockRejectedValue(
            new Error('Session expired')
        );

        renderAuthProvider();

        expect(
            await screen.findByText('Not authenticated')
        ).toBeInTheDocument();

        expect(refreshCsrfToken).not.toHaveBeenCalled();
    });

    it('should clear the user after successful logout', async () => {
        const user = await import('@testing-library/user-event')
            .then(module => module.default.setup());

        renderAuthProvider();

        await screen.findByText('Welcome Test Student');

        await user.click(
            screen.getByRole('button', { name: 'Logout' })
        );

        expect(
            await screen.findByText('Not authenticated')
        ).toBeInTheDocument();

        expect(refreshCsrfToken).toHaveBeenCalled();
        expect(logoutUser).toHaveBeenCalledTimes(1);
    });

    it('should preserve the user if logout fails', async () => {
        const user = await import('@testing-library/user-event')
            .then(module => module.default.setup());

        logoutUser.mockRejectedValue(
            new Error('Logout request failed')
        );

        renderAuthProvider();

        await screen.findByText('Welcome Test Student');

        await user.click(
            screen.getByRole('button', { name: 'Logout' })
        );

        expect(
            await screen.findByRole('alert')
        ).toHaveTextContent('Logout request failed');

        expect(
            screen.getByText('Welcome Test Student')
        ).toBeInTheDocument();
    });
});
