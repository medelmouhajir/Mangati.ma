// src/utils/authUtils.js - Token handling utilities
export const parseToken = (token) => {
    if (!token) return null;

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
};

export const isTokenValid = (token) => {
    if (!token) return false;

    const payload = parseToken(token);
    if (!payload) return false;

    const currentTime = Date.now();
    const expiryTime = payload.exp * 1000; // Convert to milliseconds

    // Check if token is expired
    if (currentTime >= expiryTime) {
        console.log('Token expired, no longer valid');
        return false;
    }

    // Check if token is about to expire (within 5 minutes)
    const timeRemaining = expiryTime - currentTime;
    if (timeRemaining < 5 * 60 * 1000) {
        console.log(`Token will expire soon (${Math.floor(timeRemaining / 1000 / 60)} minutes remaining)`);
    }

    return true;
};

export const getTokenInfo = (token) => {
    if (!token) return { valid: false };

    const payload = parseToken(token);
    if (!payload) return { valid: false };

    const currentTime = Date.now();
    const expiryTime = payload.exp * 1000;
    const timeRemaining = expiryTime - currentTime;

    return {
        valid: currentTime < expiryTime,
        expiresIn: Math.floor(timeRemaining / 1000),
        expiresInMinutes: Math.floor(timeRemaining / 1000 / 60),
        userId: payload.nameid || payload.sub,
        roles: payload.role || []
    };
};

export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token || !isTokenValid(token)) {
        clearAuthData();
        return null;
    }

    return { Authorization: `Bearer ${token}` };
};