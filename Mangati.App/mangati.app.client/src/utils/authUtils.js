// src/utils/authUtils.js
/**
 * Utility functions for JWT token handling and authentication
 */

/**
 * Parse JWT token payload
 * @param {string} token - JWT token
 * @returns {Object|null} Parsed token payload or null if invalid
 */
export const parseToken = (token) => {
    if (!token || typeof token !== 'string') {
        return null;
    }

    try {
        // JWT tokens have 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn('Invalid JWT format: token does not have 3 parts');
            return null;
        }

        // Decode the payload (second part)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Add padding if necessary
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

        const jsonPayload = window.atob(padded);
        const payload = JSON.parse(jsonPayload);

        return payload;
    } catch (error) {
        console.error('Error parsing JWT token:', error);
        return null;
    }
};

/**
 * Check if JWT token is valid and not expired
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if token is valid and not expired
 */
export const isTokenValid = (token) => {
    if (!token || typeof token !== 'string') {
        return false;
    }

    const payload = parseToken(token);
    if (!payload) {
        return false;
    }

    // Check if token has expiration time
    if (!payload.exp) {
        console.warn('Token does not have expiration time');
        return false;
    }

    // Check if token is expired (with 30 second buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp;
    const bufferTime = 30; // 30 seconds buffer

    if (currentTime >= (expirationTime - bufferTime)) {
        console.log('Token is expired or about to expire');
        return false;
    }

    return true;
};

/**
 * Get detailed information about a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Token information object
 */
export const getTokenInfo = (token) => {
    if (!token) {
        return {
            valid: false,
            expired: true,
            payload: null,
            expiresIn: 0,
            expiresInMinutes: 0,
            timeRemaining: 0
        };
    }

    const payload = parseToken(token);
    if (!payload) {
        return {
            valid: false,
            expired: true,
            payload: null,
            expiresIn: 0,
            expiresInMinutes: 0,
            timeRemaining: 0
        };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp || 0;
    const timeRemaining = Math.max(0, expirationTime - currentTime);
    const isExpired = currentTime >= expirationTime;
    const isValid = !isExpired && timeRemaining > 30; // 30 second buffer

    return {
        valid: isValid,
        expired: isExpired,
        payload,
        expiresIn: timeRemaining,
        expiresInMinutes: Math.floor(timeRemaining / 60),
        timeRemaining,
        expirationTime,
        currentTime,

        // User info from token
        userId: payload.sub || payload.nameid || payload.id,
        username: payload.unique_name || payload.username,
        email: payload.email,
        roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],

        // Token metadata
        issuer: payload.iss,
        audience: payload.aud,
        issuedAt: payload.iat,
        jwtId: payload.jti
    };
};

/**
 * Check if token is close to expiration
 * @param {string} token - JWT token
 * @param {number} minutesThreshold - Minutes before expiration to consider "close" (default: 5)
 * @returns {boolean} True if token expires within the threshold
 */
export const isTokenCloseToExpiration = (token, minutesThreshold = 5) => {
    const tokenInfo = getTokenInfo(token);

    if (!tokenInfo.valid) {
        return true; // Consider invalid tokens as "close to expiration"
    }

    return tokenInfo.expiresInMinutes <= minutesThreshold;
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = () => {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');

        // Clear any other auth-related data
        localStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('deniedAccessAttempt');

        console.log('Authentication data cleared from storage');
    } catch (error) {
        console.error('Error clearing authentication data:', error);
    }
};

/**
 * Get authorization header for API requests
 * @param {string} token - Optional token override
 * @returns {Object|null} Authorization header object or null
 */
export const getAuthHeader = (token = null) => {
    const authToken = token || localStorage.getItem('token');

    if (!authToken || !isTokenValid(authToken)) {
        return null;
    }

    return {
        'Authorization': `Bearer ${authToken}`
    };
};

/**
 * Store authentication data in localStorage
 * @param {string} token - JWT token
 * @param {Object} user - User data object
 */
export const storeAuthData = (token, user) => {
    try {
        if (!token || !user) {
            throw new Error('Token and user data are required');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('Authentication data stored successfully');
    } catch (error) {
        console.error('Error storing authentication data:', error);
        throw error;
    }
};

/**
 * Get stored user data from localStorage
 * @returns {Object|null} User data or null if not found/invalid
 */
export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userStr || !token) {
            return null;
        }

        // Validate token before returning user
        if (!isTokenValid(token)) {
            clearAuthData();
            return null;
        }

        const user = JSON.parse(userStr);

        // Basic validation of user object
        if (!user.id || !user.username) {
            console.warn('Invalid user data structure in localStorage');
            clearAuthData();
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error retrieving stored user data:', error);
        clearAuthData();
        return null;
    }
};

/**
 * Get stored token from localStorage with validation
 * @returns {string|null} Valid token or null
 */
export const getStoredToken = () => {
    const token = localStorage.getItem('token');

    if (!token || !isTokenValid(token)) {
        return null;
    }

    return token;
};

/**
 * Check if user has specific role(s)
 * @param {Object} user - User object with roles array
 * @param {string|Array} requiredRoles - Role(s) to check
 * @returns {boolean} True if user has the required role(s)
 */
export const hasRole = (user, requiredRoles) => {
    if (!user?.roles || !Array.isArray(user.roles)) {
        return false;
    }

    if (Array.isArray(requiredRoles)) {
        return requiredRoles.some(role =>
            user.roles.some(userRole =>
                userRole.toLowerCase() === role.toLowerCase()
            )
        );
    }

    return user.roles.some(userRole =>
        userRole.toLowerCase() === requiredRoles.toLowerCase()
    );
};

/**
 * Check if user has all specified roles
 * @param {Object} user - User object with roles array
 * @param {Array} requiredRoles - Array of roles to check
 * @returns {boolean} True if user has all required roles
 */
export const hasAllRoles = (user, requiredRoles) => {
    if (!user?.roles || !Array.isArray(user.roles) || !Array.isArray(requiredRoles)) {
        return false;
    }

    return requiredRoles.every(role =>
        user.roles.some(userRole =>
            userRole.toLowerCase() === role.toLowerCase()
        )
    );
};

/**
 * Format time remaining until token expiration
 * @param {string} token - JWT token
 * @returns {string} Formatted time string
 */
export const formatTokenTimeRemaining = (token) => {
    const tokenInfo = getTokenInfo(token);

    if (!tokenInfo.valid) {
        return 'Expired';
    }

    const minutes = tokenInfo.expiresInMinutes;
    const seconds = tokenInfo.expiresIn % 60;

    if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validatePassword = (password) => {
    const errors = [];

    if (!password) {
        errors.push('Password is required');
        return { isValid: false, errors };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Generate a secure random string for CSRF tokens, etc.
 * @param {number} length - Length of the random string (default: 32)
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

/**
 * Debug authentication state (for development)
 * @returns {Object} Debug information about current auth state
 */
export const debugAuthState = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const tokenInfo = getTokenInfo(token);

    return {
        hasToken: !!token,
        hasUser: !!userStr,
        tokenValid: tokenInfo.valid,
        tokenExpired: tokenInfo.expired,
        timeRemaining: formatTokenTimeRemaining(token),
        userRoles: tokenInfo.roles,
        userId: tokenInfo.userId,
        username: tokenInfo.username,
        tokenPayload: tokenInfo.payload,
        storageData: {
            token: token ? `${token.substring(0, 20)}...` : null,
            user: userStr ? JSON.parse(userStr) : null
        }
    };
};