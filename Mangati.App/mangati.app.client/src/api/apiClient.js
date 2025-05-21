// src/api/apiClient.js
import axios from 'axios';

// Create a base axios instance with common configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Default to '/api' if not set
    headers: {
        'Content-Type': 'application/json',
    },
    // Add a timeout to prevent hanging requests
    timeout: 10000, // 10 seconds
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
        // Get the original request
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Log the user out immediately
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Only redirect if not on login page already
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // Handle network errors more gracefully
        if (!error.response) {
            console.error('Network error - API might be unavailable', error.message);
            // You can dispatch a global notification here if needed
        }

        return Promise.reject(error);
    }
);

export default apiClient;