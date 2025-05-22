// src/services/authService.js
import apiClient from '../api/apiClient';

/**
 * Service for handling authentication-related API calls with enhanced token refresh
 */
class AuthService {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
        this.refreshSubscribers = [];
    }

    /**
     * Process requests in failed queue after token refresh
     * @param {string} token - New access token
     */
    processQueue(token) {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    /**
     * Add failed request to queue
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function 
     */
    addToQueue(resolve, reject) {
        this.refreshSubscribers.push(token => {
            resolve(token);
        });
    }

    /**
     * Attempts to log in a user
     * @param {string} email - The user's email
     * @param {string} password - The user's password
     * @returns {Promise} Promise object with auth response or error
     */
    async login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password
            });

            const data = response.data;

            // Store user data in localStorage
            if (data.token && data.user) {
                const userData = {
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email,
                    roles: data.user.roles,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    tokenExpiration: new Date(new Date().getTime() + (4 * 60 * 60 * 1000)).getTime(), // 4 hours default
                    createdAt: data.user.createdAt
                };
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', data.token);

                // Setup token refresh timer
                this.setupRefreshTimer(userData);
            }

            return data;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    /**
     * Setup timer to refresh token before it expires
     * @param {Object} userData - User data including token expiration time
     */
    setupRefreshTimer(userData) {
        if (!userData || !userData.tokenExpiration) return;

        // Clear any existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const currentTime = new Date().getTime();
        const timeUntilExpiry = userData.tokenExpiration - currentTime;

        // Refresh 5 minutes before expiration
        const refreshTime = Math.max(timeUntilExpiry - 300000, 0);

        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshToken()
                    .catch(error => {
                        console.error("Auto token refresh failed:", error);
                        // Consider handling this failure (maybe redirect to login)
                        this.logout();
                    });
            }, refreshTime);
        }
    }

    /**
     * Logs out the current user by removing auth data
     */
    async logout() {
        try {
            // Call logout endpoint to invalidate the refresh token if available
            const user = this.getCurrentUser();
            if (user && user.refreshToken) {
                await apiClient.post('/auth/logout', {
                    refreshToken: user.refreshToken
                });
            }
        } catch (error) {
            console.error("Logout endpoint error:", error);
            // Continue with local logout even if server logout fails
        } finally {
            // Clear local storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // Clear refresh timer
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
            }
        }
    }

    /**
     * Registers a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} Promise object with registration response
     */
    async register(userData) {
        try {
            const response = await apiClient.post('/auth/register', userData);
            const data = response.data;

            // Auto-login after successful registration
            if (data.token && data.user) {
                const userInfo = {
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email,
                    roles: data.user.roles,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    tokenExpiration: new Date(new Date().getTime() + (4 * 60 * 60 * 1000)).getTime(),
                    createdAt: data.user.createdAt
                };
                localStorage.setItem('user', JSON.stringify(userInfo));
                localStorage.setItem('token', data.token);

                // Setup token refresh timer
                this.setupRefreshTimer(userInfo);
            }

            return data;
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    }

    /**
     * Gets the current authenticated user from local storage
     * @returns {Object|null} Current user object or null if not logged in
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            const user = JSON.parse(userStr);

            // Check if token is expired
            if (user.tokenExpiration && user.tokenExpiration < new Date().getTime()) {
                console.log('Token expired, attempting refresh...');
                // Token expired, attempt to refresh
                this.refreshToken().catch(() => {
                    // If refresh fails, log the user out
                    this.logout();
                });
                return null;
            }

            return user;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return null;
        }
    }

    /**
     * Checks if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        const user = this.getCurrentUser();
        return !!user && !!user.token;
    }

    /**
     * Gets authentication header with JWT token
     * @returns {Object} Header object with Authorization if user is logged in
     */
    authHeader() {
        const user = this.getCurrentUser();
        if (user && user.token) {
            return { 'Authorization': 'Bearer ' + user.token };
        } else {
            return {};
        }
    }

    /**
     * Refreshes the access token using refresh token
     * @returns {Promise} Promise with the new token response
     */
    async refreshToken() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.refreshToken) {
            return Promise.reject('No refresh token available');
        }

        // If already refreshing, wait for the current refresh to complete
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.addToQueue(resolve, reject);
            });
        }

        this.isRefreshing = true;

        try {
            const response = await apiClient.post('/auth/refresh-token', {
                refreshToken: user.refreshToken
            });

            const data = response.data;

            // Update stored user data with new tokens
            const updatedUser = {
                ...user,
                token: data.token,
                refreshToken: data.refreshToken || user.refreshToken,
                tokenExpiration: new Date(new Date().getTime() + (data.expiresIn || 14400) * 1000).getTime()
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('token', data.token);

            // Setup new refresh timer
            this.setupRefreshTimer(updatedUser);

            // Process any requests that were waiting for the refresh
            this.processQueue(data.token);

            this.isRefreshing = false;
            return data;
        } catch (error) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            console.error("Token refresh error:", error);

            // If refresh fails, logout the user
            this.logout();
            throw error;
        }
    }

    /**
     * Performs an authenticated API call with automatic token refresh
     * @param {string} endpoint - API endpoint (without /api prefix)
     * @param {Object} options - Request options (method, data, etc.)
     * @returns {Promise} Response promise
     */
    async authenticatedRequest(endpoint, options = {}) {
        const user = this.getCurrentUser();

        // If no user or no token, throw error for protected routes
        if (!user || !user.token) {
            throw new Error('User not authenticated');
        }

        // Check if token is expired or close to expiration (less than 2 minutes)
        const isExpired = user.tokenExpiration < new Date().getTime();
        const isCloseToExpiry = user.tokenExpiration - new Date().getTime() < 120000;

        // If token is expired or close to expiry, refresh it first
        if (isExpired || isCloseToExpiry) {
            try {
                await this.refreshToken();
            } catch (error) {
                throw new Error('Authentication expired');
            }
        }

        // Perform the request using apiClient
        const { method = 'GET', data, params } = options;

        switch (method.toUpperCase()) {
            case 'GET':
                return await apiClient.get(endpoint, { params });
            case 'POST':
                return await apiClient.post(endpoint, data);
            case 'PUT':
                return await apiClient.put(endpoint, data);
            case 'DELETE':
                return await apiClient.delete(endpoint);
            case 'PATCH':
                return await apiClient.patch(endpoint, data);
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }

    /**
     * Checks if the current user has the required role
     * @param {string|Array} requiredRole - Role(s) to check
     * @returns {boolean} True if user has the required role
     */
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user || !user.roles) return false;

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
    }

    /**
     * Check if user is admin
     * @returns {boolean} True if user has admin role
     */
    isAdmin() {
        return this.hasRole('Admin');
    }

    /**
     * Check if user is writer
     * @returns {boolean} True if user has writer role
     */
    isWriter() {
        return this.hasRole('Writer');
    }

    /**
     * Request a password reset link
     * @param {string} email - User's email address
     * @returns {Promise} Promise with reset request response
     */
    async requestPasswordReset(email) {
        try {
            const response = await apiClient.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            console.error("Password reset request error:", error);
            throw error;
        }
    }

    /**
     * Validate a reset token
     * @param {string} token - Reset token to validate
     * @returns {Promise<boolean>} Promise resolving to true if token is valid
     */
    async validateResetToken(token) {
        try {
            const response = await apiClient.post('/auth/validate-reset-token', { token });
            return response.status === 200;
        } catch (error) {
            console.error("Token validation error:", error);
            return false;
        }
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise} Promise with reset response
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await apiClient.post('/auth/reset-password', {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            console.error("Password reset error:", error);
            throw error;
        }
    }

    /**
     * Get current user profile data from server
     * @returns {Promise} Promise with user profile data
     */
    async getCurrentUserProfile() {
        try {
            const response = await this.authenticatedRequest('/auth/me');
            return response.data;
        } catch (error) {
            console.error("Get current user profile error:", error);
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {Object} profileData - Updated profile data
     * @returns {Promise} Promise with updated profile response
     */
    async updateProfile(profileData) {
        try {
            const response = await this.authenticatedRequest('/auth/profile', {
                method: 'PUT',
                data: profileData
            });

            // Update local storage with new user data
            const user = this.getCurrentUser();
            if (user) {
                const updatedUser = { ...user, ...response.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            return response.data;
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
        }
    }

    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Promise with change password response
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.authenticatedRequest('/auth/change-password', {
                method: 'POST',
                data: { currentPassword, newPassword }
            });
            return response.data;
        } catch (error) {
            console.error("Change password error:", error);
            throw error;
        }
    }
}

export default new AuthService();