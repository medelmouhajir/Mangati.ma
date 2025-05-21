// src/App.jsx with debug mode & token management
import React, { useEffect, useState } from 'react';
import AppRoutes from './routes';
import { useAuth } from './hooks/useAuth';
import { getTokenInfo } from './utils/authUtils';
import './App.css';

function App() {
    const { currentUser, isAuthenticated } = useAuth();
    const [debugVisible, setDebugVisible] = useState(false);
    const [tokenInfo, setTokenInfo] = useState({});

    // Enable debug mode with Ctrl+Shift+D
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setDebugVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Update token info when auth state changes
    useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('token');
            setTokenInfo(getTokenInfo(token));
        } else {
            setTokenInfo({});
        }
    }, [isAuthenticated, currentUser]);

    return (
        <div className="app">
            <AppRoutes />

            {/* Debug panel (toggle with Ctrl+Shift+D) */}
            {debugVisible && (
                <div className="debug-panel">
                    <h3>Debug Info</h3>
                    <div className="debug-section">
                        <h4>Authentication</h4>
                        <p>Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
                        {isAuthenticated && (
                            <>
                                <p>User: {currentUser?.username}</p>
                                <p>Roles: {currentUser?.roles?.join(', ')}</p>
                                <p>Token expires in: {tokenInfo.expiresInMinutes} minutes</p>
                                <p>Token valid: {tokenInfo.valid ? 'Yes' : 'No'}</p>
                            </>
                        )}
                    </div>
                    <button
                        className="debug-close"
                        onClick={() => setDebugVisible(false)}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;