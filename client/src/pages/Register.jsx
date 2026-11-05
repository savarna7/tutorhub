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

            if (formData.role === 'tutor') {
                userData.hourlyRate = Number(formData.hourlyRate);
                userData.experienceYears = Number(formData.experienceYears);
            }

            const data = await registerUser(userData);

            console.log('Registration response:', data);

            setSuccess('Account created successfully! You can now log in.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Join TutorHub</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="fullName">Full Name</label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength="8"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="role">I want to join as</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="student">Student</option>
                        <option value="tutor">Tutor</option>
                    </select>
                </div>

                {formData.role === 'tutor' && (
                    <>
                        <div>
                            <label htmlFor="hourlyRate">
                                Hourly Rate (₹)
                            </label>
                            <input
                                type="number"
                                id="hourlyRate"
                                name="hourlyRate"
                                value={formData.hourlyRate}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="experienceYears">
                                Experience (Years)
                            </label>
                            <input
                                type="number"
                                id="experienceYears"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                min="0"
                                max="60"
                                step="1"
                                required
                            />
                        </div>
                    </>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}

            <p>
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
}

export default Register;