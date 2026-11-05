
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <nav>
            <Link to="/">TutorHub</Link>

            <div>
                {isAuthenticated ? (
                    <>
                        <span>
                            Welcome, {user.fullName}
                        </span>

                        <button onClick={logout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;