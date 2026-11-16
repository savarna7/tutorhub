
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../services/authService';

function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'student',
        hourlyRate: '',
        experienceYears: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
        setSuccess('');
        setLoading(true);

        try {
            const userData = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            // Both tutor and dual-role accounts need tutor details.
            if (formData.role === 'tutor' || formData.role === 'both') {
                userData.hourlyRate = Number(formData.hourlyRate);
                userData.experienceYears = Number(formData.experienceYears);
            }

            const data = await registerUser(userData);

            setSuccess(
                `Account created successfully! Registered roles: ${data.user.roles.join(', ')}. You can now log in.`
            );

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const needsTutorDetails =
        formData.role === 'tutor' || formData.role === 'both';

    return (
        <main className="auth-page register-page">
            <section className="auth-card register-card">
                <span className="auth-eyebrow">GET STARTED</span>

                <h1>Join TutorHub</h1>

                <p className="auth-description">
                    Create your account and start learning or teaching.
                </p>

                {error && (
                    <p className="form-error" role="alert">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="form-success" role="status">
                        {success}
                    </p>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            maxLength="100"
                            required
                        />
                    </div>

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
                            placeholder="Create a password"
                            autoComplete="new-password"
                            minLength="8"
                            required
                        />
                        <small className="auth-hint">
                            Password must contain at least 8 characters.
                        </small>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="role">I want to join as</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="student">Student</option>
                            <option value="tutor">Tutor</option>
                            <option value="both">Both student and tutor</option>
                        </select>
                    </div>

                    {needsTutorDetails && (
                        <div className="tutor-registration-fields">
                            <div className="auth-field">
                                <label htmlFor="hourlyRate">
                                    Hourly Rate (₹)
                                </label>
                                <input
                                    type="number"
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    value={formData.hourlyRate}
                                    onChange={handleChange}
                                    placeholder="e.g. 500"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="experienceYears">
                                    Experience (Years)
                                </label>
                                <input
                                    type="number"
                                    id="experienceYears"
                                    name="experienceYears"
                                    value={formData.experienceYears}
                                    onChange={handleChange}
                                    placeholder="e.g. 2"
                                    min="0"
                                    max="60"
                                    step="1"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button
                        className="auth-submit-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                </p>
            </section>
        </main>
    );
}

export default Register;
