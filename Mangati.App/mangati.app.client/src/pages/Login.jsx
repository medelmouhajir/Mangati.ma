// src/pages/Login.jsx - Enhanced version using useAuthFetch
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loading, error, clearError, isAuthenticated } = useAuth();

    // Get the redirect path from location state or session storage
    const [redirectPath] = useState(() => {
        return location.state?.from?.pathname ||
            sessionStorage.getItem('redirectAfterLogin') ||
            '/';
    });

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clear any existing error when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Clean up redirect path from session storage
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, navigate, redirectPath]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Clear specific field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Clear global error when user interacts with form
        if (error) {
            clearError();
        }
    };

    // Client-side validation
    const validateForm = () => {
        const errors = {};

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting || loading) {
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Attempt login
            await login(formData.email, formData.password);

            // Success - navigation will be handled by useEffect
            console.log('Login successful, redirecting...');

        } catch (loginError) {
            console.error('Login failed:', loginError);

            // Focus back to email field for easier retry
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle password visibility toggle
    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    // Pre-fill form with demo credentials (for development)
    const fillDemoCredentials = () => {
        setFormData({
            email: 'admin@mangati.app',
            password: 'Admin123!@#',
            rememberMe: false
        });
        clearError();
        setFormErrors({});
    };

    return (
        <div className="login-page">
            {/* Show loading spinner while checking authentication */}
            {loading && !hasCheckedAuth && (
                <div className="auth-loading">
                    <div className="loading-spinner"></div>
                    <p>Checking authentication...</p>
                </div>
            )}

            {/* Show login form only after auth check is complete */}
            {(!loading || hasCheckedAuth) && (
                <div className="auth-form-container">
                    <div className="auth-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in to your Mangati account</p>
                    </div>

                    {/* Display login message from redirect */}
                    {location.state?.message && (
                        <div className="info-message">
                            {location.state.message}
                        </div>
                    )}

                    {/* Display global error */}
                    {error && (
                        <div className="error-message">
                            <span>{error}</span>
                            <button
                                type="button"
                                onClick={clearError}
                                className="close-error"
                                aria-label="Close error"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* Email Field */}
                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email address"
                                className={formErrors.email ? 'error' : ''}
                                disabled={loading || isSubmitting}
                                autoComplete="email"
                                autoFocus
                            />
                            {formErrors.email && (
                                <div className="field-error" role="alert">
                                    {formErrors.email}
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="form-group">
                            <label htmlFor="password">
                                Password <span className="required">*</span>
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    className={formErrors.password ? 'error' : ''}
                                    disabled={loading || isSubmitting}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="password-toggle"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    disabled={loading || isSubmitting}
                                >
                                    {showPassword ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                            {formErrors.password && (
                                <div className="field-error" role="alert">
                                    {formErrors.password}
                                </div>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="form-group form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    disabled={loading || isSubmitting}
                                />
                                <span className="checkmark"></span>
                                Remember me for 30 days
                            </label>

                            <Link
                                to="/forgot-password"
                                className="forgot-password-link"
                                tabIndex={loading || isSubmitting ? -1 : 0}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`auth-submit-btn ${(loading || isSubmitting) ? 'loading' : ''}`}
                            disabled={loading || isSubmitting}
                        >
                            {loading || isSubmitting ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Development Helper - Remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                            <button
                                type="button"
                                onClick={fillDemoCredentials}
                                className="demo-btn"
                                disabled={loading || isSubmitting}
                            >
                                Fill Demo Credentials
                            </button>
                        )}
                    </form>

                    {/* Redirect to Registration */}
                    <div className="auth-switch">
                        <p>
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                state={{ from: location.state?.from }}
                                tabIndex={loading || isSubmitting ? -1 : 0}
                            >
                                Create one here
                            </Link>
                        </p>
                    </div>

                    {/* Additional Links */}
                    <div className="auth-footer">
                        <Link to="/help" className="help-link">Need help?</Link>
                        <span className="separator">•</span>
                        <Link to="/privacy" className="privacy-link">Privacy Policy</Link>
                        <span className="separator">•</span>
                        <Link to="/terms" className="terms-link">Terms of Service</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;