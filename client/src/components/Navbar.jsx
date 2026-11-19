
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function Navbar() {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogout = async () => {
        setError('');

        try {
            await logout();
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const hasStudentRole = user?.roles?.includes('student');
    const hasTutorRole = user?.roles?.includes('tutor');
    const hasBothRoles = hasStudentRole && hasTutorRole;

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="logo">
                    Tutor<span>Hub</span>
                </Link>

                <div className="nav-links">
                    <Link to="/tutors">Find Tutors</Link>

                    {!loading && isAuthenticated && (
                        <>
                            <Link to="/profile">
                                My Profile
                            </Link>
                            {hasBothRoles ? (
                                <>
                                    <Link to="/student/dashboard">
                                        Student Dashboard
                                    </Link>

                                    <Link to="/tutor/dashboard">
                                        Tutor Dashboard
                                    </Link>
                                </>
                            ) : hasStudentRole ? (
                                <Link to="/student/dashboard">
                                    My Dashboard
                                </Link>
                            ) : hasTutorRole ? (
                                <Link to="/tutor/dashboard">
                                    My Dashboard
                                </Link>
                            ) : null}
                        </>
                    )}
                </div>

                <div className="nav-actions">
                    {!loading && (
                        isAuthenticated ? (
                            <>
                                <span>Hi, {user.fullName}</span>

                                <button
                                    className="login-button"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="login-button"
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/register"
                                    className="signup-button"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )
                    )}
                </div>
            </nav>

            {error && (
                <p className="navbar-error">{error}</p>
            )}
        </>
    );
}

export default Navbar;
