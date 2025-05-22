// src/services/authService.js
import apiClient from '../api/apiClient';
import { isTokenValid, clearAuthData } from '../utils/authUtils';

/**
 * Authentication service - handles all auth-related API calls
 * This service is used by AuthContext and should not manage state directly
 */
class AuthService {
    constructor() {
        this.baseURL = '/auth';
    }

    /**
     * Login user with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} Login response with token and user data
     */
    async login(email, password) {
        console.log('AuthService: Attempting login for:', email);

        try {
            const response = await apiClient.post(`${this.baseURL}/login`, {
                email: email.trim(),
                password
            });

            console.log('AuthService: Login API response status:', response.status);

            if (!response.data) {
                throw new Error('No data received from server');
            }

            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Invalid response: missing token or user data');
            }

            // Validate token format
            if (!isTokenValid(token)) {
                throw new Error('Received invalid token from server');
            }

            console.log('AuthService: Login successful for user:', user.username);

            return {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles || [],
                    createdAt: user.createdAt
                }
            };

        } catch (error) {
            console.error('AuthService: Login error:', error);

            // Enhanced error handling
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                switch (status) {
                    case 400:
                        throw new Error(data?.message || 'Invalid login credentials format');
                    case 401:
                        throw new Error('Invalid email or password');
                    case 403:
                        throw new Error('Account access denied');
                    case 404:
                        throw new Error('Login service not available');
                    case 429:
                        throw new Error('Too many login attempts. Please try again later.');
                    case 500:
                    case 502:
                    case 503:
                        throw new Error('Server error. Please try again later.');
                    default:
                        throw new Error(data?.message || `Login failed with status ${status}`);
                }
            } else if (error.request) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(error.message || 'Login failed');
            }
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response with token and user data
     */
    async register(userData) {
        console.log('AuthService: Attempting registration for:', userData.username);

        try {
            // Validate input data
            if (!userData.username?.trim()) {
                throw new Error('Username is required');
            }
            if (!userData.email?.trim()) {
                throw new Error('Email is required');
            }
            if (!userData.password) {
                throw new Error('Password is required');
            }

            const payload = {
                username: userData.username.trim(),
                email: userData.email.trim(),
                password: userData.password,
                role: userData.role || 'Viewer'
            };

            const response = await apiClient.post(`${this.baseURL}/register`, payload);

            console.log('AuthService: Registration API response status:', response.status);

            if (!response.data) {
                throw new Error('No data received from server');
            }

            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Invalid response: missing token or user data');
            }

            // Validate token format
            if (!isTokenValid(token)) {
                throw new Error('Received invalid token from server');
            }

            console.log('AuthService: Registration successful for user:', user.username);

            return {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles || [],
                    createdAt: user.createdAt
                }
            };

        } catch (error) {
            console.error('AuthService: Registration error:', error);

            // Enhanced error handling
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                switch (status) {
                    case 400:
                        throw new Error(data?.message || 'Invalid registration data');
                    case 409:
                        throw new Error('Username or email already exists');
                    case 429:
                        throw new Error('Too many registration attempts. Please try again later.');
                    case 500:
                    case 502:
                    case 503:
                        throw new Error('Server error. Please try again later.');
                    default:
                        throw new Error(data?.message || `Registration failed with status ${status}`);
                }
            } else if (error.request) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(error.message || 'Registration failed');
            }
        }
    }

    /**
     * Logout user (invalidate token on server)
     * @returns {Promise<void>}
     */
    async logout() {
        console.log('AuthService: Logging out user');

        try {
            await apiClient.post(`${this.baseURL}/logout`);
            console.log('AuthService: Server logout successful');
        } catch (error) {
            console.warn('AuthService: Server logout failed:', error.message);
            // Don't throw error for logout - local logout should always succeed
        }
    }

    /**
     * Refresh authentication token
     * @param {string} currentToken - Current JWT token
     * @returns {Promise<Object>} New token response
     */
    async refreshToken(currentToken) {
        console.log('AuthService: Refreshing token');

        try {
            if (!currentToken) {
                throw new Error('No token provided for refresh');
            }

            const response = await apiClient.post(`${this.baseURL}/refresh-token`, {
                token: currentToken
            });

            console.log('AuthService: Token refresh API response status:', response.status);

            if (!response.data?.token) {
                throw new Error('Invalid refresh response: missing new token');
            }

            const newToken = response.data.token;

            // Validate new token format
            if (!isTokenValid(newToken)) {
                throw new Error('Received invalid token from server');
            }

            console.log('AuthService: Token refresh successful');

            return {
                token: newToken,
                user: response.data.user || null
            };

        } catch (error) {
            console.error('AuthService: Token refresh error:', error);

            // Enhanced error handling
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                switch (status) {
                    case 401:
                        throw new Error('Token refresh failed: invalid or expired token');
                    case 403:
                        throw new Error('Token refresh denied');
                    case 500:
                    case 502:
                    case 503:
                        throw new Error('Server error during token refresh');
                    default:
                        throw new Error(data?.message || `Token refresh failed with status ${status}`);
                }
            } else if (error.request) {
                throw new Error('Network error during token refresh');
            } else {
                throw new Error(error.message || 'Token refresh failed');
            }
        }
    }

    /**
     * Get current user info from server
     * @returns {Promise<Object>} Current user data
     */
    async getCurrentUser() {
        console.log('AuthService: Fetching current user');

        try {
            const response = await apiClient.get(`${this.baseURL}/me`);

            console.log('AuthService: Get current user API response status:', response.status);

            if (!response.data) {
                throw new Error('No user data received from server');
            }

            return {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email,
                roles: response.data.roles || [],
                createdAt: response.data.createdAt
            };

        } catch (error) {
            console.error('AuthService: Get current user error:', error);

            if (error.response?.status === 401) {
                throw new Error('Authentication required');
            } else if (error.response?.status === 404) {
                throw new Error('User not found');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error');
            }

            throw new Error(error.message || 'Failed to get user information');
        }
    }

    /**
     * Validate current user token with server
     * @returns {Promise<boolean>} True if token is valid
     */
    async validateCurrentUser() {
        console.log('AuthService: Validating current user token');

        try {
            await this.getCurrentUser();
            console.log('AuthService: Token validation successful');
            return true;
        } catch (error) {
            console.error('AuthService: Token validation failed:', error);
            return false;
        }
    }

    /**
     * Request password reset
     * @param {string} email - User's email
     * @returns {Promise<Object>} Reset request response
     */
    async requestPasswordReset(email) {
        console.log('AuthService: Requesting password reset for:', email);

        try {
            if (!email?.trim()) {
                throw new Error('Email is required');
            }

            const response = await apiClient.post(`${this.baseURL}/forgot-password`, {
                email: email.trim()
            });

            console.log('AuthService: Password reset request successful');
            return response.data;

        } catch (error) {
            console.error('AuthService: Password reset request error:', error);

            if (error.response?.status === 404) {
                throw new Error('No account found with that email address');
            } else if (error.response?.status === 429) {
                throw new Error('Too many reset requests. Please try again later.');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }

            throw new Error(error.response?.data?.message || 'Failed to request password reset');
        }
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Reset response
     */
    async resetPassword(token, newPassword) {
        console.log('AuthService: Resetting password with token');

        try {
            if (!token) {
                throw new Error('Reset token is required');
            }
            if (!newPassword) {
                throw new Error('New password is required');
            }

            const response = await apiClient.post(`${this.baseURL}/reset-password`, {
                token,
                newPassword
            });

            console.log('AuthService: Password reset successful');
            return response.data;

        } catch (error) {
            console.error('AuthService: Password reset error:', error);

            if (error.response?.status === 400) {
                throw new Error('Invalid or expired reset token');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }

            throw new Error(error.response?.data?.message || 'Failed to reset password');
        }
    }

    /**
     * Change password for authenticated user
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Change password response
     */
    async changePassword(currentPassword, newPassword) {
        console.log('AuthService: Changing user password');

        try {
            if (!currentPassword) {
                throw new Error('Current password is required');
            }
            if (!newPassword) {
                throw new Error('New password is required');
            }

            const response = await apiClient.post(`${this.baseURL}/change-password`, {
                currentPassword,
                newPassword
            });

            console.log('AuthService: Password change successful');
            return response.data;

        } catch (error) {
            console.error('AuthService: Change password error:', error);

            if (error.response?.status === 400) {
                throw new Error('Current password is incorrect');
            } else if (error.response?.status === 401) {
                throw new Error('Authentication required');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }

            throw new Error(error.response?.data?.message || 'Failed to change password');
        }
    }

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>} Updated profile response
     */
    async updateProfile(profileData) {
        console.log('AuthService: Updating user profile');

        try {
            const response = await apiClient.put(`${this.baseURL}/profile`, profileData);

            console.log('AuthService: Profile update successful');
            return {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email,
                roles: response.data.roles || [],
                createdAt: response.data.createdAt
            };

        } catch (error) {
            console.error('AuthService: Profile update error:', error);

            if (error.response?.status === 400) {
                throw new Error('Invalid profile data');
            } else if (error.response?.status === 401) {
                throw new Error('Authentication required');
            } else if (error.response?.status === 409) {
                throw new Error('Username or email already taken');
            } else if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }

            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    }

    /**
     * Validate token format and expiration locally
     * @param {string} token - JWT token to validate
     * @returns {boolean} True if token appears valid
     */
    validateTokenLocally(token) {
        return isTokenValid(token);
    }

    /**
     * Get auth header for API requests
     * @returns {Object} Authorization header object
     */
    getAuthHeader() {
        const token = localStorage.getItem('token');

        if (!token || !this.validateTokenLocally(token)) {
            return {};
        }

        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Check if user is currently authenticated locally
     * @returns {boolean} True if user appears to be authenticated
     */
    isAuthenticatedLocally() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) return false;

        if (!this.validateTokenLocally(token)) {
            clearAuthData();
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            return !!(user.id && user.username);
        } catch {
            clearAuthData();
            return false;
        }
    }

    /**
     * Get locally stored user data
     * @returns {Object|null} User data or null
     */
    getLocalUser() {
        if (!this.isAuthenticatedLocally()) return null;

        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            clearAuthData();
            return null;
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;