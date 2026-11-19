
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

import App from './App';
import AuthProvider from './context/AuthProvider';
import { getCurrentUser } from './services/authService';

// Mock the authentication service.
// Tests will not make real backend API requests.
vi.mock('./services/authService', () => ({
    getCurrentUser: vi.fn(),
    logoutUser: vi.fn()
}));

// Start each test with an unauthenticated user.
beforeEach(() => {
    getCurrentUser.mockResolvedValue({
        user: null
    });
});

describe('TutorHub Homepage', () => {

    it('should render the main homepage heading', async () => {
        render(
            <AuthProvider>
                <App />
            </AuthProvider>
        );

        const heading = screen.getByRole('heading', {
            level: 1,
            name: /Find the right tutor\.\s*Reach your goals\./i
        });

        expect(heading).toBeInTheDocument();

        // Wait until authentication restoration completes.
        await screen.findByRole('link', {
            name: 'Login'
        });
    });


    it('should display the correct homepage navigation links', async () => {
        render(
            <AuthProvider>
                <App />
            </AuthProvider>
        );

        const exploreLinks = screen.getAllByRole('link', {
            name: 'Explore Tutors'
        });

        const getStartedLink = screen.getByRole('link', {
            name: 'Get Started'
        });

        // Explore Tutors appears in both the hero and footer.
        expect(exploreLinks).toHaveLength(2);

        exploreLinks.forEach((link) => {
            expect(link).toHaveAttribute('href', '/tutors');
        });

        expect(getStartedLink).toHaveAttribute('href', '/register');

        await screen.findByRole('link', {
            name: 'Login'
        });
    });


});
