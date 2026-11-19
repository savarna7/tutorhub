
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ProtectedRoute({ allowedRole }) {
    const { isAuthenticated, user, loading } = useAuth();

    // Wait until session restoration finishes
    if (loading) {
        return <p>Checking your session...</p>;
    }

    // Redirect unauthenticated users
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check whether the user has the required role
    if (allowedRole && !user.roles.includes(allowedRole)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
