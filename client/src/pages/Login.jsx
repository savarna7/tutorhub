
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login, user, isAuthenticated, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const data = await loginUser(formData);

            // Save user details in React state.
            // The JWT remains in the HttpOnly cookie.
            login(data.user);

            // Student is the default dashboard for dual-role accounts.
            if (data.user.roles.includes('student')) {
                navigate('/student/dashboard');
            } else if (data.user.roles.includes('tutor')) {
                navigate('/tutor/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="auth-page">
                <p>Checking your session...</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h1>Welcome, {user.fullName}!</h1>
                    <p>You are already logged in.</p>
                    <Link className="auth-link" to="/">
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="auth-page login-page">
            <section className="auth-card">
                <span className="auth-eyebrow">WELCOME BACK</span>

                <h1>Login to TutorHub</h1>

                <p className="auth-description">
                    Continue your learning journey with the right tutor.
                </p>

                {error && (
                    <p className="form-error" role="alert">
                        {error}
                    </p>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        className="auth-submit-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login to Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/register">Sign up</Link>
                </p>
            </section>
        </main>
    );
}

export default Login;
