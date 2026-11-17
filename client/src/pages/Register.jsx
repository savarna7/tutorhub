
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { getSubjects } from '../services/tutorService';

function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'student',
        educationLevel: '',
        learningGoals: '',
        qualification: '',
        experienceYears: '',
        hourlyRate: '',
        bio: '',
        subjectIds: []
    });

    const [subjects, setSubjects] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(true);

    const needsTutorDetails =
        formData.role === 'tutor' || formData.role === 'both';

    const needsStudentDetails =
        formData.role === 'student' || formData.role === 'both';

    // Load the available subjects when the registration page opens.
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const availableSubjects = await getSubjects();
                setSubjects(availableSubjects);
            } catch (err) {
                setError(err.message);
            } finally {
                setSubjectsLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const handleSubjectChange = (event) => {
        const subjectId = event.target.value;
        const isChecked = event.target.checked;

        setFormData((previousData) => ({
            ...previousData,
            subjectIds: isChecked
                ? [...previousData.subjectIds, subjectId]
                : previousData.subjectIds.filter(
                    (id) => id !== subjectId
                )
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (needsTutorDetails && formData.subjectIds.length === 0) {
            setError('Please select at least one subject you teach.');
            return;
        }

        setLoading(true);

        try {
            const userData = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role
            };

            if (needsStudentDetails) {
                userData.educationLevel = formData.educationLevel.trim();
                userData.learningGoals = formData.learningGoals.trim();
            }

            if (needsTutorDetails) {
                userData.qualification = formData.qualification.trim();
                userData.experienceYears = Number(formData.experienceYears);
                userData.hourlyRate = Number(formData.hourlyRate);
                userData.bio = formData.bio.trim();
                userData.subjectIds = formData.subjectIds.map(Number);
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
                            maxLength="255"
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

                    {needsStudentDetails && (
                        <div className="student-registration-fields">
                            <h2>Student Information</h2>

                            <div className="auth-field">
                                <label htmlFor="educationLevel">
                                    Education Level
                                </label>
                                <input
                                    type="text"
                                    id="educationLevel"
                                    name="educationLevel"
                                    value={formData.educationLevel}
                                    onChange={handleChange}
                                    placeholder="e.g. B.Tech, Class 12"
                                    maxLength="100"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="learningGoals">
                                    Learning Goals
                                </label>
                                <textarea
                                    id="learningGoals"
                                    name="learningGoals"
                                    value={formData.learningGoals}
                                    onChange={handleChange}
                                    placeholder="What would you like to learn?"
                                    rows="3"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {needsTutorDetails && (
                        <div className="tutor-registration-fields">
                            <h2>Tutor Information</h2>

                            <div className="auth-field">
                                <label htmlFor="qualification">
                                    Qualification
                                </label>
                                <input
                                    type="text"
                                    id="qualification"
                                    name="qualification"
                                    value={formData.qualification}
                                    onChange={handleChange}
                                    placeholder="e.g. B.Tech Computer Science"
                                    maxLength="150"
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
                                    placeholder="e.g. 2.5"
                                    min="0"
                                    max="60"
                                    step="0.1"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="hourlyRate">
                                    Hourly Rate (₹)
                                </label>
                                <input
                                    max="99999999.99"
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
                                <label htmlFor="bio">About You</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Describe your teaching experience and approach."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label>Subjects You Teach</label>

                                {subjectsLoading ? (
                                    <p>Loading subjects...</p>
                                ) : subjects.length === 0 ? (
                                    <p>No subjects are currently available.</p>
                                ) : (
                                    <div className="subject-selection">
                                        {subjects.map((subject) => (
                                            <label key={subject.id}>
                                                <input
                                                    type="checkbox"
                                                    value={subject.id}
                                                    checked={formData.subjectIds.includes(
                                                        String(subject.id)
                                                    )}
                                                    onChange={handleSubjectChange}
                                                />
                                                {subject.name}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        className="auth-submit-button"
                        type="submit"
                        disabled={
                            loading ||
                            subjectsLoading ||
                            (needsTutorDetails && subjects.length === 0)
                        }
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
