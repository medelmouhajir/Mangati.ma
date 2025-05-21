// src/api/apiClient.js - Updated token handling
import axios from 'axios';

// Create a base axios instance with common configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // Increased to 30 seconds for file uploads
});

// Helper function to parse token payload
const parseToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        console.error('Error parsing token:', e);
        return null;
    }
};

// Add request interceptor for auth
apiClient.interceptors.request.use(
    (config) => {
        console.log(`Request to ${config.url}`, { method: config.method });

        // Add JWT token to every request if available
        const token = localStorage.getItem('token');
        if (token) {
            // Log token for debugging (only partial for security)
            const tokenStart = token.substring(0, 10);
            const tokenEnd = token.substring(token.length - 5);
            console.log(`Using token ${tokenStart}...${tokenEnd}`);

            const payload = parseToken(token);
            if (payload) {
                // Check expiration
                const expiryTime = payload.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();
                const timeRemaining = expiryTime - currentTime;

                console.log(`Token expires in ${Math.floor(timeRemaining / 1000 / 60)} minutes`);

                if (currentTime >= expiryTime) {
                    console.log('Token expired, removing from storage');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    return config; // Continue request without token
                }
            }

            // Add token with exact expected format
            config.headers.Authorization = `Bearer ${token}`;

            // Log full request headers for debugging
            console.log('Request headers:', config.headers);
        } else {
            console.log('No token available');
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}: ${response.status}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        console.log(`Error response from ${originalRequest?.url}:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });

        // Handle 401 Unauthorized errors more carefully
        if (error.response?.status === 401) {
            console.log('401 Unauthorized response received');

            // Check if we're already on login page or making auth requests
            const isAuthRequest = originalRequest.url?.includes('/auth/');
            const isOnLoginPage = window.location.pathname.includes('/login');

            if (!isAuthRequest && !isOnLoginPage && !originalRequest._retry) {
                console.log('Non-auth request failed with 401, redirecting to login');
                originalRequest._retry = true;

                // Clear auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Store the current path to redirect back after login
                const currentPath = window.location.pathname + window.location.search;
                if (currentPath !== '/login') {
                    sessionStorage.setItem('redirectAfterLogin', currentPath);
                }

                // Redirect to login after a small delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 250);
            } else {
                console.log('Auth request or already on login page, not redirecting');
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;