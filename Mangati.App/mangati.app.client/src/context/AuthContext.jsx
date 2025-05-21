// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Try to load user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        // Check if token exists and fetch current user info
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const userData = await authApi.getCurrentUser();
                setCurrentUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (err) {
                console.error('Failed to fetch user:', err);
                setError('Authentication failed. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await authApi.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            return data.user;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const data = await authApi.register(userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            return data.user;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authApi.logout();
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.roles?.includes('Admin'),
        isWriter: currentUser?.roles?.includes('Writer'),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
