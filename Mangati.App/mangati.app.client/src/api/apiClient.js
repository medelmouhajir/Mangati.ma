
// src/api/apiClient.js
import axios from 'axios';

// Create a base axios instance with common configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Default to '/api' if not set
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for auth
apiClient.interceptors.request.use(
    (config) => {
        // Add JWT token to every request if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh token or log out the user
            // If token refresh functionality is needed in the future,
            // this would be the place to implement it

            // For now, simply log the user out
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default apiClient;