// src/components/common/DeniedAccess.jsx - Enhanced version
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

const DeniedAccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, currentUser, logout } = useAuth();

    const [deniedInfo, setDeniedInfo] = useState({
        title: "Access Denied",
        message: "You don't have permission to access this resource.",
        type: "permission", // permission, authentication, role
        attemptedUrl: null,
        requiredRole: null
    });

    useEffect(() => {
        // Get denial reason from URL params or session storage
        const reason = searchParams.get('reason');
        const requiredRole = searchParams.get('role');
        const attemptedUrl = sessionStorage.getItem('deniedAccessAttempt') ||
            searchParams.get('attempted');

        let newDeniedInfo = { ...deniedInfo };

        switch (reason) {
            case 'authentication':
                newDeniedInfo = {
                    title: "Authentication Required",
                    message: "You need to be logged in to access this page.",
                    type: "authentication",
                    attemptedUrl,
                    requiredRole: null
                };
                break;

            case 'role':
                newDeniedInfo = {
                    title: "Insufficient Privileges",
                    message: `You need ${requiredRole || 'elevated'} privileges to access this resource.`,
                    type: "role",
                    attemptedUrl,
                    requiredRole
                };
                break;

            case 'subscription':
                newDeniedInfo = {
                    title: "Subscription Required",
                    message: "An active subscription is required to access this feature.",
                    type: "subscription",
                    attemptedUrl,
                    requiredRole: null
                };
                break;

            default:
                newDeniedInfo = {
                    title: "Access Denied",
                    message: "You don't have permission to access this resource.",
                    type: "permission",
                    attemptedUrl,
                    requiredRole
                };
        }

        setDeniedInfo(newDeniedInfo);

        // Clear the attempted URL from session storage after reading it
        if (attemptedUrl) {
            sessionStorage.removeItem('deniedAccessAttempt');
        }
    }, [searchParams]);

    const handleGoBack = () => {
        navigate(-1); // Go back to previous page
    };

    const handleLogout = () => {
        logout();
    };

    const handleRetryAfterLogin = () => {
        // Store the attempted URL for after login
        if (deniedInfo.attemptedUrl) {
            sessionStorage.setItem('redirectAfterLogin', deniedInfo.attemptedUrl);
        }
        navigate('/login');
    };

    const getActionButtons = () => {
        const buttons = [];

        // Always show go back and home buttons
        buttons.push(
            <button key="back" onClick={handleGoBack} className="go-back-btn">
                Go Back
            </button>
        );

        buttons.push(
            <Link key="home" to="/" className="home-btn">
                Go to Homepage
            </Link>
        );

        // Show different buttons based on authentication status and denial type
        if (!isAuthenticated) {
            if (deniedInfo.type === 'authentication') {
                buttons.push(
                    <button key="login" onClick={handleRetryAfterLogin} className="login-btn">
                        Login to Continue
                    </button>
                );
            } else {
                buttons.push(
                    <Link key="login" to="/login" className="login-btn">
                        Login
                    </Link>
                );
            }
        } else {
            // User is authenticated but lacks permission
            if (deniedInfo.type === 'role') {
                buttons.push(
                    <button key="logout" onClick={handleLogout} className="logout-btn">
                        Login as Different User
                    </button>
                );
            } else if (deniedInfo.type === 'subscription') {
                buttons.push(
                    <Link key="subscription" to="/subscription" className="subscription-btn">
                        View Subscription Plans
                    </Link>
                );
            }
        }

        return buttons;
    };

    const getIconByType = () => {
        switch (deniedInfo.type) {
            case 'authentication':
                return (
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4" />
                        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                        <path d="M12 3v18" />
                    </svg>
                );
            case 'subscription':
                return (
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                );
            default:
                return (
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                );
        }
    };

    return (
        <div className="denied-access-page">
            <div className="denied-access-container">
                <div className={`denied-access-icon ${deniedInfo.type}`}>
                    {getIconByType()}
                </div>

                <h1>{deniedInfo.title}</h1>
                <p className="denied-message">{deniedInfo.message}</p>

                {isAuthenticated && (
                    <div className="user-info">
                        <p>Logged in as: <strong>{currentUser?.username}</strong></p>
                        <p>Current role(s): <strong>{currentUser?.roles?.join(', ') || 'No roles assigned'}</strong></p>
                        {deniedInfo.requiredRole && (
                            <p>Required role: <strong>{deniedInfo.requiredRole}</strong></p>
                        )}
                    </div>
                )}

                {deniedInfo.attemptedUrl && (
                    <div className="attempted-url">
                        <p>You tried to access:</p>
                        <code>{deniedInfo.attemptedUrl}</code>
                    </div>
                )}

                <div className="denied-actions">
                    {getActionButtons()}
                </div>

                <div className="contact-admin">
                    <p>If you believe this is an error, please contact your administrator.</p>
                </div>
            </div>
        </div>
    );
};

export default DeniedAccess;