
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

import userEvent from '@testing-library/user-event';

import {
    MemoryRouter,
    Routes,
    Route
} from 'react-router-dom';

import Login from './Login';
import AuthProvider from '../context/AuthProvider';

import {
    getCurrentUser,
    loginUser
} from '../services/authService';

// Mock authentication API calls.
vi.mock('../services/authService', () => ({
    getCurrentUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn()
}));

beforeEach(() => {
    getCurrentUser.mockResolvedValue({
        user: null
    });
});

function renderLogin() {
    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/student/dashboard"
                        element={<p>Student dashboard</p>}
                    />

                    <Route
                        path="/tutor/dashboard"
                        element={<p>Tutor dashboard</p>}
                    />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

describe('Login Page', () => {

    it('should render the login form correctly', async () => {
        renderLogin();

        expect(
            await screen.findByRole('heading', {
                name: 'Login to TutorHub'
            })
        ).toBeInTheDocument();

        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'Login to Account'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('link', {
                name: 'Sign up'
            })
        ).toHaveAttribute('href', '/register');
    });

    it('should log in a student and redirect to the student dashboard', async () => {
        const user = userEvent.setup();

        loginUser.mockResolvedValue({
            user: {
                id: 1,
                fullName: 'Test Student',
                roles: ['student']
            }
        });

        renderLogin();

        await user.type(
            await screen.findByLabelText('Email Address'),
            'student@test.com'
        );

        await user.type(
            screen.getByLabelText('Password'),
            'password123'
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Login to Account'
            })
        );

        expect(
            await screen.findByText('Student dashboard')
        ).toBeInTheDocument();

        expect(loginUser).toHaveBeenCalledWith({
            email: 'student@test.com',
            password: 'password123'
        });
    });

    it('should log in a tutor and redirect to the tutor dashboard', async () => {
        const user = userEvent.setup();

        loginUser.mockResolvedValue({
            user: {
                id: 2,
                fullName: 'Test Tutor',
                roles: ['tutor']
            }
        });

        renderLogin();

        await user.type(
            await screen.findByLabelText('Email Address'),
            'tutor@test.com'
        );

        await user.type(
            screen.getByLabelText('Password'),
            'password123'
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Login to Account'
            })
        );

        expect(
            await screen.findByText('Tutor dashboard')
        ).toBeInTheDocument();
    });

    it('should display an error when login fails', async () => {
        const user = userEvent.setup();

        loginUser.mockRejectedValue(
            new Error('Invalid email or password')
        );

        renderLogin();

        await user.type(
            await screen.findByLabelText('Email Address'),
            'wrong@test.com'
        );

        await user.type(
            screen.getByLabelText('Password'),
            'wrongpassword'
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Login to Account'
            })
        );

        expect(
            await screen.findByRole('alert')
        ).toHaveTextContent('Invalid email or password');
    });

    it('should show a loading state while login is processing', async () => {
        const user = userEvent.setup();

        let resolveLogin;

        loginUser.mockReturnValue(
            new Promise((resolve) => {
                resolveLogin = resolve;
            })
        );

        renderLogin();

        await user.type(
            await screen.findByLabelText('Email Address'),
            'student@test.com'
        );

        await user.type(
            screen.getByLabelText('Password'),
            'password123'
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Login to Account'
            })
        );

        const loadingButton = screen.getByRole('button', {
            name: 'Logging in...'
        });

        expect(loadingButton).toBeDisabled();

        resolveLogin({
            user: {
                id: 1,
                fullName: 'Test Student',
                roles: ['student']
            }
        });

        expect(
            await screen.findByText('Student dashboard')
        ).toBeInTheDocument();
    });

});
