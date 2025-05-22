// src/hooks/useAuthFetch.js
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook that provides authentication state and actions
 * This is a simple wrapper around useAuth for backward compatibility
 */
export const useAuthFetch = () => {
    const authContext = useAuth();

    // Return the auth context with some additional computed properties for convenience
    return {
        // Core auth state
        ...authContext,

        // Backward compatibility aliases
        currentUser: authContext.user,
        isAuthenticated: authContext.isAuthenticated(),

        // Convenience methods
        isAdmin: () => authContext.hasRole('Admin'),
        isWriter: () => authContext.hasRole('Writer'),
        isViewer: () => authContext.hasRole('Viewer'),

        // Check multiple roles
        canWrite: () => authContext.hasAnyRole(['Writer', 'Admin']),
        canAdmin: () => authContext.hasRole('Admin'),

        // Role checking utilities
        hasRole: authContext.hasRole,
        hasAnyRole: authContext.hasAnyRole,

        // User info getters
        getUserId: () => authContext.user?.id,
        getUsername: () => authContext.user?.username,
        getUserEmail: () => authContext.user?.email,
        getUserRoles: () => authContext.user?.roles || [],

        // Authentication status
        isLoading: authContext.loading,
        isInitialized: authContext.isInitialized,
        authError: authContext.error,

        // Actions (aliased for clarity)
        signIn: authContext.login,
        signUp: authContext.register,
        signOut: authContext.logout,
        refreshAuth: authContext.refreshToken,
        clearAuthError: authContext.clearError,

        // Update user data
        updateUserData: authContext.updateUser
    };
};

// Export default for easier imports
export default useAuthFetch;