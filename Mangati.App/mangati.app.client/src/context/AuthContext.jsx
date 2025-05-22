// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../api/authService';
import { isTokenValid, parseToken, clearAuthData } from '../utils/authUtils';

// Create auth context with default values
const AuthContext = createContext({
    // State
    user: null,
    loading: true,
    error: null,
    isInitialized: false,

    // Actions
    login: async () => { },
    register: async () => { },
    logout: () => { },
    refreshToken: async () => { },
    clearError: () => { },

    // Getters
    isAuthenticated: () => false,
    hasRole: () => false,
    hasAnyRole: () => false,

    // User data
    getCurrentUser: () => null,
    updateUser: () => { }
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // State
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Hooks
    const navigate = useNavigate();
    const location = useLocation();

    // Refs for cleanup
    const refreshTimerRef = React.useRef(null);
    const isRefreshingRef = React.useRef(false);

    // Clear any existing refresh timer
    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    // Setup automatic token refresh
    const setupTokenRefresh = useCallback((userData) => {
        if (!userData?.token) return;

        clearRefreshTimer();

        const tokenPayload = parseToken(userData.token);
        if (!tokenPayload?.exp) return;

        const currentTime = Date.now();
        const expirationTime = tokenPayload.exp * 1000;
        const timeUntilExpiry = expirationTime - currentTime;

        // Refresh 2 minutes before expiration, but only if more than 2 minutes remain
        const refreshTime = Math.max(timeUntilExpiry - 120000, 0);

        if (refreshTime > 0 && timeUntilExpiry > 120000) {
            console.log(`Setting up token refresh in ${Math.floor(refreshTime / 1000 / 60)} minutes`);

            refreshTimerRef.current = setTimeout(async () => {
                try {
                    await handleRefreshToken();
                } catch (error) {
                    console.error('Auto token refresh failed:', error);
                    await handleLogout();
                }
            }, refreshTime);
        }
    }, [clearRefreshTimer]);

    // Initialize authentication state
    useEffect(() => {
        const initializeAuth = async () => {
            console.log('Initializing authentication...');
            setLoading(true);

            try {
                const token = localStorage.getItem('token');
                const userStr = localStorage.getItem('user');

                if (!token || !userStr) {
                    console.log('No stored auth data found');
                    setUser(null);
                    return;
                }

                if (!isTokenValid(token)) {
                    console.log('Stored token is invalid or expired');
                    clearAuthData();
                    setUser(null);
                    return;
                }

                const userData = JSON.parse(userStr);
                console.log('Restored user session:', userData.username);

                setUser(userData);
                setupTokenRefresh(userData);

                // Optionally validate token with server
                try {
                    await authService.validateCurrentUser();
                    console.log('Token validated with server');
                } catch (validationError) {
                    console.warn('Server token validation failed:', validationError.message);
                    // Don't logout immediately, let the user continue until next API call fails
                }

            } catch (error) {
                console.error('Auth initialization error:', error);
                clearAuthData();
                setUser(null);
                setError('Failed to restore authentication session');
            } finally {
                setLoading(false);
                setIsInitialized(true);
            }
        };

        initializeAuth();

        // Cleanup on unmount
        return () => {
            clearRefreshTimer();
        };
    }, [setupTokenRefresh, clearRefreshTimer]);

    // Login function
    const handleLogin = useCallback(async (email, password, rememberMe = false) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting login for:', email);

            const response = await authService.login(email, password);

            if (!response?.token || !response?.user) {
                throw new Error('Invalid response from server');
            }

            const userData = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
                roles: response.user.roles || [],
                token: response.token,
                loginTime: Date.now(),
                rememberMe
            };

            // Store in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setupTokenRefresh(userData);

            console.log('Login successful for user:', userData.username);

            return userData;

        } catch (error) {
            console.error('Login failed:', error);

            // Clear any partial auth state
            clearAuthData();
            setUser(null);

            // Set user-friendly error message
            if (error.response?.status === 401) {
                setError('Invalid email or password');
            } else if (error.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Login failed. Please try again.');
            }

            throw error;
        } finally {
            setLoading(false);
        }
    }, [setupTokenRefresh]);

    // Register function
    const handleRegister = useCallback(async (userData) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting registration for:', userData.username);

            const response = await authService.register(userData);

            if (!response?.token || !response?.user) {
                throw new Error('Invalid response from server');
            }

            const newUser = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
                roles: response.user.roles || [],
                token: response.token,
                loginTime: Date.now(),
                rememberMe: false
            };

            // Store in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(newUser));

            setUser(newUser);
            setupTokenRefresh(newUser);

            console.log('Registration successful for user:', newUser.username);

            return newUser;

        } catch (error) {
            console.error('Registration failed:', error);

            // Clear any partial auth state
            clearAuthData();
            setUser(null);

            // Set user-friendly error message
            if (error.response?.status === 400) {
                setError(error.response.data?.message || 'Registration failed. Please check your input.');
            } else if (error.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Registration failed. Please try again.');
            }

            throw error;
        } finally {
            setLoading(false);
        }
    }, [setupTokenRefresh]);

    // Logout function
    const handleLogout = useCallback(async (navigateToLogin = true) => {
        console.log('Logging out user');

        clearRefreshTimer();

        try {
            // Call server logout endpoint if available
            if (user?.token) {
                await authService.logout().catch(error => {
                    console.warn('Server logout failed (continuing with local logout):', error.message);
                });
            }
        } catch (error) {
            console.warn('Logout request failed:', error);
        }

        // Clear local state
        clearAuthData();
        setUser(null);
        setError(null);

        // Navigate to login if requested
        if (navigateToLogin && location.pathname !== '/login') {
            navigate('/login', {
                state: {
                    from: location,
                    message: 'You have been logged out successfully.'
                }
            });
        }
    }, [clearRefreshTimer, user, navigate, location]);

    // Refresh token function
    const handleRefreshToken = useCallback(async () => {
        // Prevent multiple simultaneous refresh attempts
        if (isRefreshingRef.current) {
            console.log('Token refresh already in progress, skipping...');
            return false;
        }

        if (!user?.token) {
            console.log('No user token available for refresh');
            return false;
        }

        isRefreshingRef.current = true;

        try {
            console.log('Refreshing token...');

            const response = await authService.refreshToken(user.token);

            if (!response?.token) {
                throw new Error('Invalid refresh response');
            }

            const updatedUser = {
                ...user,
                token: response.token,
                loginTime: Date.now()
            };

            // Update stored data
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setUser(updatedUser);
            setupTokenRefresh(updatedUser);

            console.log('Token refreshed successfully');
            return true;

        } catch (error) {
            console.error('Token refresh failed:', error);

            // If refresh fails, logout the user
            await handleLogout();
            return false;
        } finally {
            isRefreshingRef.current = false;
        }
    }, [user, setupTokenRefresh, handleLogout]);

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        if (!user?.token) return false;
        return isTokenValid(user.token);
    }, [user]);

    // Check if user has specific role
    const hasRole = useCallback((requiredRole) => {
        if (!user?.roles) return false;

        if (Array.isArray(requiredRole)) {
            return requiredRole.some(role =>
                user.roles.some(userRole =>
                    userRole.toLowerCase() === role.toLowerCase()
                )
            );
        }

        return user.roles.some(userRole =>
            userRole.toLowerCase() === requiredRole.toLowerCase()
        );
    }, [user]);

    // Check if user has any of the specified roles
    const hasAnyRole = useCallback((roles) => {
        if (!Array.isArray(roles) || !user?.roles) return false;

        return roles.some(role =>
            user.roles.some(userRole =>
                userRole.toLowerCase() === role.toLowerCase()
            )
        );
    }, [user]);

    // Get current user (safe copy)
    const getCurrentUser = useCallback(() => {
        if (!user) return null;

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: [...(user.roles || [])],
            loginTime: user.loginTime,
            rememberMe: user.rememberMe
        };
    }, [user]);

    // Update user data (for profile updates)
    const updateUser = useCallback((updates) => {
        if (!user) return;

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, [user]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Context value
    const contextValue = {
        // State
        user: getCurrentUser(),
        loading,
        error,
        isInitialized,

        // Actions
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshToken: handleRefreshToken,
        clearError,

        // Getters
        isAuthenticated,
        hasRole,
        hasAnyRole,

        // User data
        getCurrentUser,
        updateUser
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;