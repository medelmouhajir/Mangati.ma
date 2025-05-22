// src/api/authApi.js - Updated to use apiClient with token refresh capabilities
import apiClient from './apiClient';
import { clearAuthData, isTokenValid, parseToken } from '../utils/authUtils';

class AuthApiService {
    constructor() {
        this.isRefreshing = false;
        this.refreshSubscribers = [];
        this.refreshTimer = null;
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
            if (token) {
                resolve(token);
            } else {
                reject(new Error('Token refresh failed'));
            }
        });
    }

    /**
     * Setup timer to refresh token before it expires
     * @param {Object} userData - User data including token
     */
    setupRefreshTimer(userData) {
        if (!userData || !userData.token) return;

        // Clear any existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const tokenPayload = parseToken(userData.token);
        if (!tokenPayload) return;

        const currentTime = Date.now();
        const expirationTime = tokenPayload.exp * 1000;
        const timeUntilExpiry = expirationTime - currentTime;

        // Refresh 2 minutes before expiration, but only if more than 2 minutes remain
        const refreshTime = Math.max(timeUntilExpiry - 120000, 0);

        if (refreshTime > 0 && timeUntilExpiry > 120000) {
            console.log(`Setting up token refresh in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
            this.refreshTimer = setTimeout(() => {
                this.refreshToken()
                    .catch(error => {
                        console.error("Auto token refresh failed:", error);
                        // Consider redirecting to login on auto-refresh failure
                        clearAuthData();
                        window.location.href = '/login';
                    });
            }, refreshTime);
        }
    }

    /**
     * Attempts to log in a user
     * @param {string} email - The user's email
     * @param {string} password - The user's password
     * @returns {Promise} Promise object with auth response or error
     */
    async login(email, password) {
        console.log('Attempting login for email:', email);
        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password
            });

            console.log('Login API response:', response.status);

            // Validate response data
            if (!response.data || !response.data.token || !response.data.user) {
                throw new Error('Invalid response from server');
            }

            const { token, user } = response.data;

            // Store auth data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Setup token refresh timer
            this.setupRefreshTimer({ token });

            console.log('Login successful:', user);
            return response.data;
        } catch (error) {
            console.error('Login API error:', error.message);

            // Enhanced error handling
            if (error.response?.status === 401) {
                throw new Error('Invalid email or password');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw error;
        }
    }

    /**
     * Registers a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} Promise object with registration response
     */
    async register(userData) {
        console.log('Attempting registration for user:', userData.username);
        try {
            const response = await apiClient.post('/auth/register', userData);

            console.log('Registration API response:', response.status);

            // Validate response data
            if (!response.data || !response.data.token || !response.data.user) {
                throw new Error('Invalid response from server');
            }

            const { token, user } = response.data;

            // Store auth data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Setup token refresh timer
            this.setupRefreshTimer({ token });

            console.log('Registration successful:', user);
            return response.data;
        } catch (error) {
            console.error('Registration API error:', error.message);

            // Enhanced error handling
            if (error.response?.status === 400) {
                throw new Error(error.response.data?.message || 'Registration failed. Please check your input.');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }

            throw error;
        }
    }

    /**
     * Gets the current authenticated user info from server
     * @returns {Promise} Promise with current user data
     */
    async getCurrentUser() {
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
    }

    /**
     * Logs out the current user
     */
    logout() {
        console.log('Logout called');

        // Clear refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // Clear auth data
        clearAuthData();

        // Optional: Call logout endpoint to invalidate refresh token on server
        // This should be a fire-and-forget request since user is already logged out locally
        try {
            apiClient.post('/auth/logout').catch(error => {
                console.warn('Server logout failed (continuing with local logout):', error.message);
            });
        } catch (error) {
            // Ignore errors for logout endpoint
            console.warn('Logout endpoint error:', error.message);
        }
    }

    /**
     * Refreshes the access token using refresh token
     * @returns {Promise} Promise with the new token response
     */
    async refreshToken() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            throw new Error('No authentication data available');
        }

        // If already refreshing, wait for the current refresh to complete
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.addToQueue(resolve, reject);
            });
        }

        this.isRefreshing = true;

        try {
            console.log('Attempting to refresh token');

            // Call refresh endpoint (you may need to implement this on your server)
            const response = await apiClient.post('/auth/refresh-token', {
                token: token
            });

            if (!response.data?.token) {
                throw new Error('Invalid refresh response from server');
            }

            const { token: newToken, user: updatedUser } = response.data;

            // Update stored auth data
            localStorage.setItem('token', newToken);
            if (updatedUser) {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            // Setup new refresh timer
            this.setupRefreshTimer({ token: newToken });

            // Process any requests that were waiting for the refresh
            this.processQueue(newToken);

            console.log('Token refreshed successfully');
            return response.data;
        } catch (error) {
            console.error('Token refresh error:', error);

            // Clear failed queue
            this.refreshSubscribers.forEach(callback => callback(null));
            this.refreshSubscribers = [];

            // Clear auth data on refresh failure
            clearAuthData();

            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Method to validate token with backend - useful for security
     * @returns {Promise<boolean>} Promise resolving to true if token is valid
     */
    async validateToken() {
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
    }

    /**
     * Gets the current authenticated user from local storage
     * @returns {Object|null} Current user object or null if not logged in
     */
    getCurrentUserLocal() {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userStr || !token) return null;

        // Validate token before returning user
        if (!isTokenValid(token)) {
            clearAuthData();
            return null;
        }

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            clearAuthData();
            return null;
        }
    }

    /**
     * Checks if user is authenticated locally
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token && isTokenValid(token);
    }

    /**
     * Checks if the current user has the required role
     * @param {string|Array} requiredRole - Role(s) to check
     * @returns {boolean} True if user has the required role
     */
    hasRole(requiredRole) {
        const user = this.getCurrentUserLocal();
        if (!user || !user.roles) return false;

        if (Array.isArray(requiredRole)) {
            return requiredRole.some(role => user.roles.includes(role));
        }

        return user.roles.includes(requiredRole);
    }

    /**
     * Request a password reset link
     * @param {string} email - User's email address
     * @returns {Promise} Promise with reset request response
     */
    async requestPasswordReset(email) {
        try {
            console.log('Requesting password reset for:', email);
            const response = await apiClient.post('/auth/forgot-password', { email });
            console.log('Password reset request response:', response.status);
            return response.data;
        } catch (error) {
            console.error('Password reset request error:', error);

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw new Error('Failed to request password reset');
        }
    }

    /**
     * Validate a reset token
     * @param {string} token - Reset token to validate
     * @returns {Promise<boolean>} Promise resolving to true if token is valid
     */
    async validateResetToken(token) {
        try {
            console.log('Validating reset token');
            const response = await apiClient.post('/auth/validate-reset-token', { token });
            console.log('Reset token validation response:', response.status);
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
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
            console.log('Resetting password with token');
            const response = await apiClient.post('/auth/reset-password', {
                token,
                newPassword
            });
            console.log('Password reset response:', response.status);
            return response.data;
        } catch (error) {
            console.error('Password reset error:', error);

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw new Error('Failed to reset password');
        }
    }

    /**
     * Change user password (for authenticated users)
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Promise with change password response
     */
    async changePassword(currentPassword, newPassword) {
        try {
            console.log('Changing user password');
            const response = await apiClient.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            console.log('Change password response:', response.status);
            return response.data;
        } catch (error) {
            console.error('Change password error:', error);

            if (error.response?.status === 400) {
                throw new Error('Current password is incorrect');
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw new Error('Failed to change password');
        }
    }

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise} Promise with update response
     */
    async updateProfile(profileData) {
        try {
            console.log('Updating user profile');
            const response = await apiClient.put('/auth/profile', profileData);
            console.log('Profile update response:', response.status);

            // Update local user data
            if (response.data?.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw new Error('Failed to update profile');
        }
    }
}

// Create and export a singleton instance
export const authApi = new AuthApiService();