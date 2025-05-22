// src/features/auth/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../api/authService';

// Create auth context
const AuthContext = createContext({
    user: null,
    loading: true,
    error: null,
    login: () => { },
    logout: () => { },
    refreshToken: () => { },
    isAuthenticated: () => false,
    hasRole: () => false,
    setError: () => { },
    clearError: () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            try {
                const currentUser = authService.getCurrentUser();

                if (currentUser) {
                    // Check if token needs to be refreshed
                    const tokenExpiry = currentUser.tokenExpiration;
                    const now = new Date().getTime();

                    // If token is expired or close to expiry (less than 5 minutes)
                    if (tokenExpiry - now < 5 * 60 * 1000) {
                        try {
                            await authService.refreshToken();
                            // Get the updated user data
                            const refreshedUser = authService.getCurrentUser();
                            setUser(refreshedUser);
                        } catch (refreshError) {
                            console.error('Failed to refresh token during initialization:', refreshError);
                            authService.logout();
                            setUser(null);
                        }
                    } else {
                        setUser(currentUser);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                setError('Failed to initialize authentication');
            } finally {
                setLoading(false);
                setIsInitialized(true);
            }
        };

        initAuth();
    }, []);

    // Setup token refresh interceptor
    useEffect(() => {
        if (!isInitialized) return;

        // Setup refresh token timer if user is logged in
        if (user) {
            const tokenExpiry = user.tokenExpiration;
            const now = new Date().getTime();

            // If token is still valid
            if (tokenExpiry > now) {
                // Refresh 1 minute before expiry
                const refreshTime = tokenExpiry - now - (60 * 1000);

                const tokenTimer = setTimeout(async () => {
                    try {
                        await authService.refreshToken();
                        // Update user state with refreshed token
                        const refreshedUser = authService.getCurrentUser();
                        setUser(refreshedUser);
                    } catch (err) {
                        console.error('Token refresh timer error:', err);
                        // Handle refresh error (logout or retry)
                        authService.logout();
                        setUser(null);
                        navigate('/login', {
                            state: { from: location, message: 'Your session expired. Please login again.' }
                        });
                    }
                }, refreshTime);

                // Cleanup timer on unmount
                return () => clearTimeout(tokenTimer);
            }
        }
    }, [isInitialized, user, navigate, location]);

    // Login handler
    const handleLogin = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await authService.login(username, password);
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);
            return data;
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Logout handler
    const handleLogout = () => {
        authService.logout();
        setUser(null);
        navigate('/login');
    };

    // Refresh token handler
    const handleRefreshToken = async () => {
        try {
            await authService.refreshToken();
            const refreshedUser = authService.getCurrentUser();
            setUser(refreshedUser);
            return true;
        } catch (err) {
            console.error('Manual token refresh error:', err);
            setError('Failed to refresh authentication token');
            return false;
        }
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!user && !!user.token;
    };

    // Check if user has role
    const hasRole = (requiredRole) => {
        if (!user) return false;

        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(user.role);
        }

        return user.role === requiredRole;
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    const contextValue = {
        user,
        loading,
        error,
        login: handleLogin,
        logout: handleLogout,
        refreshToken: handleRefreshToken,
        isAuthenticated,
        hasRole,
        setError,
        clearError
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;