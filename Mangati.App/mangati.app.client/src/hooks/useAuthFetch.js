// src/hooks/useAuthFetch.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../api/authService';

/**
 * Custom hook for making authenticated API requests with automatic token refresh
 */
const useAuthFetch2 = () => {
    const { user, refreshToken } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Execute authenticated fetch request with token refresh
     * @param {string} url - API URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} Response data or error
     */
    const authFetch = useCallback(async (url, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            // Add auth header if not already present
            const headers = options.headers || {};

            if (user && user.token && !headers.Authorization) {
                headers.Authorization = `Bearer ${user.token}`;
            }

            // Make the API request
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle 401 Unauthorized errors
            if (response.status === 401) {
                // Try to refresh the token
                const refreshed = await refreshToken();

                if (refreshed) {
                    // Retry the request with the new token
                    const newUser = authService.getCurrentUser();
                    const newHeaders = {
                        ...headers,
                        Authorization: `Bearer ${newUser.token}`
                    };

                    const retryResponse = await fetch(url, {
                        ...options,
                        headers: newHeaders
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`Request failed with status: ${retryResponse.status}`);
                    }

                    setLoading(false);
                    return await retryResponse.json();
                } else {
                    // Token refresh failed, redirect to login
                    navigate('/login', {
                        state: { from: window.location.pathname, message: 'Your session expired. Please login again.' }
                    });
                    throw new Error('Authentication failed. Please login again.');
                }
            }

            // Handle other errors
            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
            }

            const data = await response.json();
            setLoading(false);
            return data;
        } catch (err) {
            setError(err.message || 'An error occurred');
            setLoading(false);
            throw err;
        }
    }, [user, refreshToken, navigate]);

    return { authFetch, loading, error, setError };
};

export const useAuthFetch = useAuthFetch2;