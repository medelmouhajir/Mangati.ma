// src/components/layout/Header.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthFetch } from '../../hooks/useAuthFetch';

const Header = () => {
    const { isAuthenticated, currentUser, logout } = useAuthFetch();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-container">
                <Link to="/" className="logo">
                    <h1>Mangati</h1>
                </Link>

                {/* Mobile menu toggle button */}
                <button
                    className="mobile-menu-toggle"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                >
                    <span className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </span>
                </button>

                {/* Navigation menu - shows on desktop or when mobile menu is open */}
                <div className={`nav-container ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <nav className="main-nav">
                        <ul>
                            <li>
                                <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                            </li>
                            <li>
                                <Link to="/browse" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
                            </li>
                            {(currentUser?.roles?.includes('Writer') || currentUser?.roles?.includes('Admin')) && (
                                <li>
                                    <Link to="/upload" onClick={() => setMobileMenuOpen(false)}>Upload</Link>
                                </li>
                            )}
                        </ul>
                    </nav>

                    <div className="auth-section">
                        {isAuthenticated ? (
                            <div className="user-menu">
                                <span className="welcome-text">Welcome, {currentUser.username}</span>
                                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="profile-btn">Profile</Link>
                                <button onClick={handleLogout} className="logout-btn">Logout</button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="login-btn">Login</Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="register-btn">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;