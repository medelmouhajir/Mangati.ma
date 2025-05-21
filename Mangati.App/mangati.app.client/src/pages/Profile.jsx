
// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { mangaApi } from '../api/mangaApi';
import MangaCard from '../components/manga/MangaCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
    const { currentUser, logout } = useAuth();

    const [activeTab, setActiveTab] = useState('my-manga');
    const [userManga, setUserManga] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewerSettings, setViewerSettings] = useState({
        theme: 'light',
        readingMode: 'pageFlip',
        fitToWidth: true,
        zoomLevel: 100
    });

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'my-manga') {
                    // Fetch user's manga series (for writers)
                    if (currentUser.roles.includes('Writer') || currentUser.roles.includes('Admin')) {
                        const data = await mangaApi.getMangaList({ authorId: currentUser.id });
                        setUserManga(data);
                    }
                } else if (activeTab === 'favorites') {
                    // Fetch user's favorites
                    const data = await mangaApi.getFavorites();
                    setFavorites(data);
                }
            } catch (err) {
                console.error('Failed to fetch user data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [activeTab, currentUser]);

    const handleSaveSettings = () => {
        // In a real app, you would send these settings to the server
        // For now, just save to localStorage
        localStorage.setItem('viewerSettings', JSON.stringify(viewerSettings));
        alert('Settings saved successfully!');
    };

    const handleSettingChange = (setting, value) => {
        setViewerSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const renderActiveTab = () => {
        if (loading) {
            return <LoadingSpinner />;
        }

        if (error) {
            return <div className="error-message">{error}</div>;
        }

        switch (activeTab) {
            case 'my-manga':
                return (
                    <div className="my-manga-tab">
                        {currentUser.roles.includes('Writer') || currentUser.roles.includes('Admin') ? (
                            <>
                                <div className="tab-header">
                                    <h2>My Manga Series</h2>
                                    <Link to="/upload" className="create-btn">Create New Series</Link>
                                </div>

                                {userManga.length === 0 ? (
                                    <div className="empty-state">
                                        <p>You haven't created any manga series yet.</p>
                                        <Link to="/upload" className="cta-button">Create Your First Manga</Link>
                                    </div>
                                ) : (
                                    <div className="manga-grid">
                                        {userManga.map(manga => (
                                            <MangaCard key={manga.id} manga={manga} />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>You don't have writer privileges.</p>
                                <p>If you want to create manga, please contact an administrator.</p>
                            </div>
                        )}
                    </div>
                );

            case 'favorites':
                return (
                    <div className="favorites-tab">
                        <h2>My Favorites</h2>

                        {favorites.length === 0 ? (
                            <div className="empty-state">
                                <p>You haven't added any manga to your favorites yet.</p>
                                <Link to="/browse" className="cta-button">Browse Manga</Link>
                            </div>
                        ) : (
                            <div className="manga-grid">
                                {favorites.map(manga => (
                                    <MangaCard key={manga.id} manga={manga} />
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'settings':
                return (
                    <div className="settings-tab">
                        <h2>Reader Settings</h2>

                        <form className="settings-form">
                            <div className="form-group">
                                <label htmlFor="theme">Theme</label>
                                <select
                                    id="theme"
                                    value={viewerSettings.theme}
                                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="readingMode">Reading Mode</label>
                                <select
                                    id="readingMode"
                                    value={viewerSettings.readingMode}
                                    onChange={(e) => handleSettingChange('readingMode', e.target.value)}
                                >
                                    <option value="pageFlip">Page Flip</option>
                                    <option value="verticalScroll">Vertical Scroll</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={viewerSettings.fitToWidth}
                                        onChange={(e) => handleSettingChange('fitToWidth', e.target.checked)}
                                    />
                                    Fit to Width
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="zoomLevel">
                                    Zoom Level: {viewerSettings.zoomLevel}%
                                </label>
                                <input
                                    type="range"
                                    id="zoomLevel"
                                    min="50"
                                    max="200"
                                    step="10"
                                    value={viewerSettings.zoomLevel}
                                    onChange={(e) => handleSettingChange('zoomLevel', parseInt(e.target.value, 10))}
                                />
                            </div>

                            <button type="button" onClick={handleSaveSettings} className="save-settings-btn">
                                Save Settings
                            </button>
                        </form>
                    </div>
                );

            case 'account':
                return (
                    <div className="account-tab">
                        <h2>Account Information</h2>

                        <div className="account-info">
                            <div className="info-group">
                                <label>Username</label>
                                <p>{currentUser.username}</p>
                            </div>

                            <div className="info-group">
                                <label>Email</label>
                                <p>{currentUser.email}</p>
                            </div>

                            <div className="info-group">
                                <label>Role</label>
                                <p>{currentUser.roles.join(', ')}</p>
                            </div>

                            <div className="info-group">
                                <label>Member Since</label>
                                <p>{new Date(currentUser.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="account-actions">
                            <button className="change-password-btn">Change Password</button>
                            <button className="logout-btn" onClick={logout}>Logout</button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="user-info">
                    <h1>My Profile</h1>
                    <p className="username">{currentUser.username}</p>
                    <p className="role">{currentUser.roles.join(', ')}</p>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-tabs">
                    {(currentUser.roles.includes('Writer') || currentUser.roles.includes('Admin')) && (
                        <button
                            className={`tab-btn ${activeTab === 'my-manga' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my-manga')}
                        >
                            My Manga
                        </button>
                    )}

                    <button
                        className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                    >
                        Favorites
                    </button>

                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Reader Settings
                    </button>

                    <button
                        className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        Account
                    </button>
                </div>

                <div className="tab-content">
                    {renderActiveTab()}
                </div>
            </div>
        </div>
    );
};

export default Profile;