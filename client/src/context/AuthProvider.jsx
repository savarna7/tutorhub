
import {
    useEffect,
    useState
} from 'react';

import { AuthContext } from './AuthContext';

import {
    getCurrentUser,
    logoutUser,
    refreshCsrfToken
} from '../services/authService';

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore the session when the application starts.
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const data = await getCurrentUser();

                setUser(data.user);

                // Always refresh the CSRF token for this session.
                try {
                    await refreshCsrfToken();
                } catch (error) {
                    console.error(
                        'CSRF token refresh failed:',
                        error.message
                    );
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    // Update React state after successful login.
    const login = (userData) => {
        setUser(userData);
    };

    // Refresh the current user's information.
    const refreshUser = async () => {
        try {
            const data = await getCurrentUser();
            setUser(data.user);
            return data.user;
        } catch {
            setUser(null);
            return null;
        }
    };

    // Log out only after the backend confirms success.
    const logout = async () => {
        await refreshCsrfToken();
        await logoutUser();

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: Boolean(user),
                login,
                logout,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
