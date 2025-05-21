// src/pages/Upload.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mangaApi } from '../api/mangaApi';
import { filtersApi } from '../api/filtersApi';
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
    const [newTagInput, setNewTagInput] = useState('');
    const [newLanguageInput, setNewLanguageInput] = useState('');

    const [loading, setLoading] = useState(false);
    const [filtersLoading, setFiltersLoading] = useState(true);
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

        // Fetch filters (languages and tags) from API
        const fetchFilters = async () => {
            setFiltersLoading(true);
            try {
                const filters = await filtersApi.getAllFilters();
                setLanguages(filters.languages || []);
                setTags(filters.tags || []);
            } catch (err) {
                console.error('Failed to fetch filters:', err);
                setError('Failed to load languages and tags. Please try again later.');
            } finally {
                setFiltersLoading(false);
            }
        };

        fetchFilters();
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

    const handleCreateTag = async (e) => {
        e.preventDefault();
        if (!newTagInput.trim()) return;

        try {
            setFiltersLoading(true);
            const newTag = await filtersApi.createTag({ name: newTagInput.trim() });
            setTags([...tags, newTag]);
            // Automatically select the new tag
            setFormData(prev => ({
                ...prev,
                tagIds: [...prev.tagIds, newTag.id]
            }));
            setNewTagInput('');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create tag';
            setError(errorMessage);
            console.error('Error creating tag:', err);
        } finally {
            setFiltersLoading(false);
        }
    };

    const handleCreateLanguage = async (e) => {
        e.preventDefault();
        if (!newLanguageInput.trim()) return;

        // Only admin can create languages
        if (!currentUser.roles.includes('Admin')) {
            setError('Only administrators can add new languages');
            return;
        }

        try {
            setFiltersLoading(true);
            const newLanguage = await filtersApi.createLanguage({ name: newLanguageInput.trim() });
            setLanguages([...languages, newLanguage]);
            // Automatically select the new language
            setFormData(prev => ({
                ...prev,
                languageIds: [...prev.languageIds, newLanguage.id]
            }));
            setNewLanguageInput('');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create language';
            setError(errorMessage);
            console.error('Error creating language:', err);
        } finally {
            setFiltersLoading(false);
        }
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

    if (loading || filtersLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="upload-page">
            <h1>Create New Manga Series</h1>

            {error && (
                <div className="error-message">
                    {error}
                    <button className="close-error" onClick={() => setError(null)}>×</button>
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

                    {currentUser.roles.includes('Admin') && (
                        <div className="add-new-item">
                            <input
                                type="text"
                                value={newLanguageInput}
                                onChange={(e) => setNewLanguageInput(e.target.value)}
                                placeholder="Add new language..."
                            />
                            <button
                                type="button"
                                onClick={handleCreateLanguage}
                                disabled={!newLanguageInput.trim()}
                                className="add-btn"
                            >
                                Add
                            </button>
                        </div>
                    )}
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

                    <div className="add-new-item">
                        <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            placeholder="Add new tag..."
                        />
                        <button
                            type="button"
                            onClick={handleCreateTag}
                            disabled={!newTagInput.trim()}
                            className="add-btn"
                        >
                            Add
                        </button>
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