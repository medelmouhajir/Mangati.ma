
// src/pages/MangaView.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mangaApi } from '../api/mangaApi';
import { useAuthFetch } from '../hooks/useAuthFetch';
import ChapterList from '../components/manga/ChapterList';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MangaView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, currentUser } = useAuthFetch();

    const [manga, setManga] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    useEffect(() => {
        const fetchManga = async () => {
            setLoading(true);
            try {
                const data = await mangaApi.getManga(id);
                setManga(data);

                // Check if this manga is in user's favorites
                if (isAuthenticated) {
                    try {
                        const favorites = await mangaApi.getFavorites();
                        setIsFavorite(favorites.some(fav => fav.id === data.id));
                    } catch (err) {
                        console.error('Failed to fetch favorites:', err);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch manga:', err);
                setError('Failed to load manga. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchManga();
    }, [id, isAuthenticated]);

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await mangaApi.removeFromFavorites(id);
                setIsFavorite(false);
            } else {
                await mangaApi.addToFavorites(id);
                setIsFavorite(true);
            }
        } catch (err) {
            console.error('Failed to update favorites:', err);
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleEdit = () => {
        navigate(`/manga/${id}/edit`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this manga series? This action cannot be undone.')) {
            try {
                await mangaApi.deleteManga(id);
                navigate('/');
            } catch (err) {
                console.error('Failed to delete manga:', err);
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!manga) {
        return <div>Manga not found.</div>;
    }

    const isAuthor = isAuthenticated && currentUser.id === manga.authorId;
    const isAdmin = isAuthenticated && currentUser.roles.includes('Admin');
    const canEdit = isAuthor || isAdmin;

    return (
        <div className="manga-view">
            <div className="manga-header">
                <div className="manga-cover">
                    <img src={manga.coverImageUrl} alt={manga.title} />
                </div>

                <div className="manga-info">
                    <h1>{manga.title}</h1>

                    <div className="manga-meta">
                        <p><strong>Author:</strong> {manga.authorName}</p>
                        <p><strong>Status:</strong> {manga.status === 0 ? 'Ongoing' : 'Completed'}</p>

                        {manga.languages && manga.languages.length > 0 && (
                            <p>
                                <strong>Languages:</strong>{' '}
                                {manga.languages.map(lang => lang.name).join(', ')}
                            </p>
                        )}

                        {manga.tags && manga.tags.length > 0 && (
                            <div className="manga-tags">
                                <strong>Tags:</strong>
                                <div className="tags-list">
                                    {manga.tags.map(tag => (
                                        <span key={tag.id} className="tag">{tag.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p><strong>Last Updated:</strong> {new Date(manga.updatedAt || manga.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="manga-actions">
                        <button
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                        >
                            {favoriteLoading ? 'Loading...' : isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        </button>

                        {canEdit && (
                            <>
                                <button onClick={handleEdit} className="edit-btn">
                                    Edit Manga
                                </button>
                                <button onClick={handleDelete} className="delete-btn">
                                    Delete Manga
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="manga-synopsis">
                <h2>Synopsis</h2>
                <p>{manga.synopsis}</p>
            </div>

            <div className="manga-chapters">
                <h2>Chapters</h2>
                {manga.chapters && manga.chapters.length > 0 ? (
                    <ChapterList chapters={manga.chapters} mangaId={manga.id} />
                ) : (
                    <p>No chapters available yet.</p>
                )}
            </div>
        </div>
    );
};

export default MangaView;