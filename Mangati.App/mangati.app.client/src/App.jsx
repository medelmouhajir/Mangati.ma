// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

// Simple placeholder components until we implement the full app
const Home = () => (
    <div className="home-container">
        <h1>Welcome to Mangati</h1>
        <p>Your manga reading platform</p>
        <div className="action-buttons">
            <Link to="/browse" className="browse-btn">Browse Manga</Link>
        </div>
    </div>
);

const Browse = () => <h1>Browse Manga</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

function App() {
    // Remove the weatherforecast check and just set loading to false
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-container">
                    <Link to="/" className="logo">Mangati</Link>
                    <nav className="main-nav">
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/browse">Browse</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading Mangati App...</p>
                    </div>
                ) : (
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                )}
            </main>

            <footer className="app-footer">
                <div className="footer-container">
                    <p>&copy; {new Date().getFullYear()} Mangati App</p>
                </div>
            </footer>
        </div>
    );
}

export default App;