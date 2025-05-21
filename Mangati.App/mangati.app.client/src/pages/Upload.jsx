// src/pages/Upload.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mangaApi } from '../api/mangaApi';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Upload = () => {
    const navigate = useNavigate();
    const { isAuthenticated, currentUser } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        coverImageUrl: '',
        languageIds: [],
        tagIds: []
    });

    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if user is logged in and has Writer role
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (isAuthenticated && !currentUser.roles.includes('Writer') && !currentUser.roles.includes('Admin')) {
            navigate('/');
            return;
        }

        // Fetch languages and tags data
        const fetchData = async () => {
            try {
                // In a real app, you would fetch languages and tags from API endpoints
                // For now, just set placeholder data
                setLanguages([
                    { id: 1, name: 'English' },
                    { id: 2, name: 'Japanese' },
                    { id: 3, name: 'Spanish' },
                    { id: 4, name: 'French' },
                ]);

                setTags([
                    { id: 1, name: 'Action' },
                    { id: 2, name: 'Adventure' },
                    { id: 3, name: 'Comedy' },
                    { id: 4, name: 'Drama' },
                    { id: 5, name: 'Fantasy' },
                    { id: 6, name: 'Horror' },
                    { id: 7, name: 'Romance' },
                    { id: 8, name: 'Sci-Fi' },
                ]);
            } catch (err) {
                console.error('Failed to fetch form data:', err);
                setError('Failed to load languages and tags. Please try again later.');
            }
        };

        fetchData();
    }, [isAuthenticated, currentUser, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleLanguageToggle = (id) => {
        setFormData(prev => {
            const languageIds = [...prev.languageIds];

            if (languageIds.includes(id)) {
                return {
                    ...prev,
                    languageIds: languageIds.filter(langId => langId !== id)
                };
            } else {
                return {
                    ...prev,
                    languageIds: [...languageIds, id]
                };
            }
        });
    };

    const handleTagToggle = (id) => {
        setFormData(prev => {
            const tagIds = [...prev.tagIds];

            if (tagIds.includes(id)) {
                return {
                    ...prev,
                    tagIds: tagIds.filter(tagId => tagId !== id)
                };
            } else {
                return {
                    ...prev,
                    tagIds: [...tagIds, id]
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!formData.title.trim()) {
            setError('Please enter a title for your manga.');
            return;
        }

        if (!formData.synopsis.trim()) {
            setError('Please enter a synopsis for your manga.');
            return;
        }

        if (!formData.coverImageUrl.trim()) {
            setError('Please provide a cover image URL for your manga.');
            return;
        }

        if (formData.languageIds.length === 0) {
            setError('Please select at least one language for your manga.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newManga = await mangaApi.createManga({
                title: formData.title,
                synopsis: formData.synopsis,
                coverImageUrl: formData.coverImageUrl,
                languageIds: formData.languageIds,
                tagIds: formData.tagIds
            });

            setSuccess(true);

            // Navigate to the new manga page after a short delay
            setTimeout(() => {
                navigate(`/manga/${newManga.id}`);
            }, 2000);
        } catch (err) {
            console.error('Failed to create manga:', err);
            setError(err.response?.data?.message || 'Failed to create manga. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="upload-page">
            <h1>Create New Manga Series</h1>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    Manga series created successfully! Redirecting...
                </div>
            )}

            <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-group">
                    <label htmlFor="title">Title <span className="required">*</span></label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter manga title"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="synopsis">Synopsis <span className="required">*</span></label>
                    <textarea
                        id="synopsis"
                        name="synopsis"
                        value={formData.synopsis}
                        onChange={handleInputChange}
                        placeholder="Enter a brief description of your manga"
                        rows="5"
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="coverImageUrl">Cover Image URL <span className="required">*</span></label>
                    <input
                        type="url"
                        id="coverImageUrl"
                        name="coverImageUrl"
                        value={formData.coverImageUrl}
                        onChange={handleInputChange}
                        placeholder="Enter URL for cover image"
                        required
                    />
                    {formData.coverImageUrl && (
                        <div className="cover-preview">
                            <img src={formData.coverImageUrl} alt="Cover preview" />
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Languages <span className="required">*</span></label>
                    <div className="checkbox-group">
                        {languages.map(language => (
                            <label key={language.id} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.languageIds.includes(language.id)}
                                    onChange={() => handleLanguageToggle(language.id)}
                                />
                                {language.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Tags</label>
                    <div className="checkbox-group tags-grid">
                        {tags.map(tag => (
                            <label key={tag.id} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.tagIds.includes(tag.id)}
                                    onChange={() => handleTagToggle(tag.id)}
                                />
                                {tag.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/')} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Manga Series'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Upload;