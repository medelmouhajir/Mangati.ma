// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Function to check if token is valid
    const isTokenValid = useCallback((token) => {
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000;
            return Date.now() < expiry;
        } catch {
            return false;
        }
    }, []);

    // Function to clear auth data
    const clearAuthData = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
    }, []);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            console.log('Initializing auth state...');

            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (storedUser && token && isTokenValid(token)) {
                    console.log('Valid token found, setting user');
                    setCurrentUser(JSON.parse(storedUser));
                } else if (token && storedUser) {
                    console.log('Invalid/expired token found, clearing auth data');
                    clearAuthData();
                } else {
                    console.log('No auth data found');
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                clearAuthData();
            } finally {
                setLoading(false);
                setAuthChecked(true);
            }
        };

        initializeAuth();
    }, [isTokenValid, clearAuthData]);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting login...');
            const data = await authApi.login(email, password);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);

            console.log('Login successful:', data.user);

            // Check for redirect URL
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }

            return data.user;
        } catch (err) {
            console.error('Login failed:', err);

            let errorMessage = 'Login failed. Please try again.';

            if (err.isNetworkError) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Invalid email or password.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting registration...');
            const data = await authApi.register(userData);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);

            console.log('Registration successful:', data.user);
            return data.user;
        } catch (err) {
            console.error('Registration failed:', err);

            let errorMessage = 'Registration failed. Please try again.';

            if (err.isNetworkError) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(() => {
        console.log('Logging out...');
        authApi.logout();
        clearAuthData();

        // Clear any pending redirects
        sessionStorage.removeItem('redirectAfterLogin');

        // Navigate to home page
        window.location.href = '/';
    }, [clearAuthData]);

    // Function to refresh user data
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token || !isTokenValid(token)) {
            clearAuthData();
            return null;
        }

        try {
            const userData = await authApi.getCurrentUser();
            localStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
            return userData;
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            clearAuthData();
            return null;
        }
    }, [isTokenValid, clearAuthData]);

    const value = {
        currentUser,
        loading,
        error,
        authChecked,
        login,
        register,
        logout,
        refreshUser,
        clearError: () => setError(null),
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.roles?.includes('Admin') || false,
        isWriter: currentUser?.roles?.includes('Writer') || false,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};