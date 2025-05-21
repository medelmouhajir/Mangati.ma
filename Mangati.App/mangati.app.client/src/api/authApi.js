// src/api/authApi.js - Improved with better error handling and token management
import apiClient from './apiClient';
import { clearAuthData } from '../utils/authUtils';

export const authApi = {
    login: async (email, password) => {
        console.log('Attempting login for email:', email);
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            console.log('Login API response:', response.status);

            // Validate response data
            if (!response.data || !response.data.token || !response.data.user) {
                throw new Error('Invalid response from server');
            }

            return response.data;
        } catch (error) {
            console.error('Login API error:', error.message);
            throw error;
        }
    },

    register: async (userData) => {
        console.log('Attempting registration for user:', userData.username);
        try {
            const response = await apiClient.post('/auth/register', userData);
            console.log('Registration API response:', response.status);

            // Validate response data
            if (!response.data || !response.data.token || !response.data.user) {
                throw new Error('Invalid response from server');
            }

            return response.data;
        } catch (error) {
            console.error('Registration API error:', error.message);
            throw error;
        }
    },

    getCurrentUser: async () => {
        console.log('Fetching current user data');
        try {
            const response = await apiClient.get('/auth/me');
            console.log('Get current user API response:', response.status);
            return response.data;
        } catch (error) {
            console.error('Get current user API error:', error.message);

            // Clear auth if we get unauthorized trying to get user info
            if (error.response?.status === 401) {
                clearAuthData();
            }

            throw error;
        }
    },

    logout: () => {
        console.log('Logout called');
        clearAuthData();
    },

    // Method to validate token with backend - useful for security
    validateToken: async () => {
        console.log('Validating token with server');
        try {
            const response = await apiClient.post('/auth/validate-token');
            console.log('Token validation response:', response.status);
            return true;
        } catch (error) {
            console.error('Token validation error:', error.message);

            if (error.response?.status === 401) {
                clearAuthData();
            }

            return false;
        }
    },
};