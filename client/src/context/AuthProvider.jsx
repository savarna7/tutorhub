import {
    useEffect,
    useState
} from 'react';

import { AuthContext } from './AuthContext';

import {
    getCurrentUser,
    logoutUser
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

    // Log out from the backend and clear frontend state.
    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
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