
// src/components/layout/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
    const { isAuthenticated, currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="app-header">
            <div className="container header-container">
                <Link to="/" className="logo">
                    <h1>Mangati</h1>
                </Link>

                <nav className="main-nav">
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/browse">Browse</Link></li>
                        {(currentUser?.roles?.includes('Writer') || currentUser?.roles?.includes('Admin')) && (
                            <li><Link to="/upload">Upload</Link></li>
                        )}
                    </ul>
                </nav>

                <div className="auth-section">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <span>Welcome, {currentUser.username}</span>
                            <Link to="/profile">Profile</Link>
                            <button onClick={handleLogout} className="logout-btn">Logout</button>
                        </div>
                    ) : (
                        <div>
                            <Link to="/login" className="login-btn">Login</Link>
                            <Link to="/register" className="register-btn">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;