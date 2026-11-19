
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

import { MemoryRouter } from 'react-router-dom';

import Register from './Register';

import { registerUser } from '../services/authService';
import { getSubjects } from '../services/tutorService';

// Mock API calls.
vi.mock('../services/authService', () => ({
    registerUser: vi.fn(),
    getCurrentUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn()
}));

vi.mock('../services/tutorService', () => ({
    getSubjects: vi.fn()
}));

const mockSubjects = [
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Physics' },
    { id: 3, name: 'C Programming' }
];

beforeEach(() => {
    getSubjects.mockResolvedValue(mockSubjects);

    registerUser.mockResolvedValue({
        user: {
            roles: ['student']
        }
    });
});

function renderRegister() {
    return render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );
}

async function fillCommonFields(user) {
    await user.type(
        await screen.findByLabelText('Full Name'),
        'Alex Test'
    );

    await user.type(
        screen.getByLabelText('Email Address'),
        'alex@test.com'
    );

    await user.type(
        screen.getByLabelText('Password'),
        'password123'
    );
}

async function fillStudentFields(user) {
    await user.type(
        await screen.findByLabelText('Education Level'),
        'B.Tech'
    );

    await user.type(
        screen.getByLabelText('Learning Goals'),
        'Learn programming and mathematics'
    );
}

async function fillTutorFields(user) {
    await user.type(
        await screen.findByLabelText('Qualification'),
        'B.Tech Computer Science'
    );

    await user.type(
        screen.getByLabelText('Experience (Years)'),
        '2.5'
    );

    await user.type(
        screen.getByLabelText('Hourly Rate (₹)'),
        '500'
    );

    await user.type(
        screen.getByLabelText('About You'),
        'I enjoy teaching programming and mathematics.'
    );

    await user.click(
        screen.getByRole('checkbox', {
            name: 'Mathematics'
        })
    );
}

describe('Registration Page', () => {

    it('should display student fields by default', async () => {
        renderRegister();

        expect(
            await screen.findByRole('heading', {
                name: 'Join TutorHub'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText('Education Level')
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText('Learning Goals')
        ).toBeInTheDocument();

        expect(
            screen.queryByLabelText('Qualification')
        ).not.toBeInTheDocument();
    });

    it('should register a student with student-specific information', async () => {
        const user = userEvent.setup();

        renderRegister();

        await fillCommonFields(user);
        await fillStudentFields(user);

        await user.click(
            screen.getByRole('button', {
                name: 'Create Account'
            })
        );

        expect(
            await screen.findByRole('status')
        ).toHaveTextContent('Account created successfully!');

        expect(registerUser).toHaveBeenCalledWith({
            fullName: 'Alex Test',
            email: 'alex@test.com',
            password: 'password123',
            role: 'student',
            educationLevel: 'B.Tech',
            learningGoals: 'Learn programming and mathematics'
        });
    });

    it('should display tutor fields when tutor role is selected', async () => {
        const user = userEvent.setup();

        renderRegister();

        await user.selectOptions(
            await screen.findByLabelText('I want to join as'),
            'tutor'
        );

        expect(
            await screen.findByLabelText('Qualification')
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText('Experience (Years)')
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText('Hourly Rate (₹)')
        ).toBeInTheDocument();

        expect(
            screen.queryByLabelText('Education Level')
        ).not.toBeInTheDocument();
    });

    it('should register a tutor with selected subjects', async () => {
        const user = userEvent.setup();

        renderRegister();

        await fillCommonFields(user);

        await user.selectOptions(
            screen.getByLabelText('I want to join as'),
            'tutor'
        );

        await fillTutorFields(user);

        await user.click(
            screen.getByRole('button', {
                name: 'Create Account'
            })
        );

        expect(
            await screen.findByRole('status')
        ).toHaveTextContent('Account created successfully!');

        expect(registerUser).toHaveBeenCalledWith({
            fullName: 'Alex Test',
            email: 'alex@test.com',
            password: 'password123',
            role: 'tutor',
            qualification: 'B.Tech Computer Science',
            experienceYears: 2.5,
            hourlyRate: 500,
            bio: 'I enjoy teaching programming and mathematics.',
            subjectIds: [1]
        });
    });

    it('should register a dual-role account with both sets of information', async () => {
        const user = userEvent.setup();

        registerUser.mockResolvedValue({
            user: {
                roles: ['student', 'tutor']
            }
        });

        renderRegister();

        await fillCommonFields(user);

        await user.selectOptions(
            screen.getByLabelText('I want to join as'),
            'both'
        );

        await fillStudentFields(user);
        await fillTutorFields(user);

        await user.click(
            screen.getByRole('button', {
                name: 'Create Account'
            })
        );

        expect(
            await screen.findByRole('status')
        ).toHaveTextContent(
            'Account created successfully! Registered roles: student, tutor.'
        );

        expect(registerUser).toHaveBeenCalledWith({
            fullName: 'Alex Test',
            email: 'alex@test.com',
            password: 'password123',
            role: 'both',
            educationLevel: 'B.Tech',
            learningGoals: 'Learn programming and mathematics',
            qualification: 'B.Tech Computer Science',
            experienceYears: 2.5,
            hourlyRate: 500,
            bio: 'I enjoy teaching programming and mathematics.',
            subjectIds: [1]
        });
    });

    it('should prevent tutor registration without selecting a subject', async () => {
        const user = userEvent.setup();

        renderRegister();

        await fillCommonFields(user);

        await user.selectOptions(
            screen.getByLabelText('I want to join as'),
            'tutor'
        );

        await user.type(
            await screen.findByLabelText('Qualification'),
            'B.Tech Computer Science'
        );

        await user.type(
            screen.getByLabelText('Experience (Years)'),
            '2'
        );

        await user.type(
            screen.getByLabelText('Hourly Rate (₹)'),
            '500'
        );

        await user.type(
            screen.getByLabelText('About You'),
            'I enjoy teaching.'
        );

        await user.click(
            screen.getByRole('button', {
                name: 'Create Account'
            })
        );

        expect(
            await screen.findByRole('alert')
        ).toHaveTextContent(
            'Please select at least one subject you teach.'
        );

        expect(registerUser).not.toHaveBeenCalled();
    });

    it('should display an API error when registration fails', async () => {
        const user = userEvent.setup();

        registerUser.mockRejectedValue(
            new Error('Email already exists')
        );

        renderRegister();

        await fillCommonFields(user);
        await fillStudentFields(user);

        await user.click(
            screen.getByRole('button', {
                name: 'Create Account'
            })
        );

        expect(
            await screen.findByRole('alert')
        ).toHaveTextContent('Email already exists');
    });

});
