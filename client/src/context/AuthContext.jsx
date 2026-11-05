import { createContext, useContext, useState } from 'react';

// Create the authentication context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Save user information after successful login
    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
    };

    // Clear authentication information during logout
    const logout = () => {
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: Boolean(user && token),
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to access authentication context
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }

    return context;
}