// src/pages/Upload.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mangaApi } from '../api/mangaApi';
import { filtersApi } from '../api/filtersApi';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Upload = () => {
    const navigate = useNavigate();
    const { isAuthenticated, currentUser, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        coverImageUrl: '',
        languageIds: [],
        tagIds: []
    });

    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    // New tag/language creation
    const [newTag, setNewTag] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [addingTag, setAddingTag] = useState(false);
    const [addingLanguage, setAddingLanguage] = useState(false);

    // Authentication check with better error handling
    useEffect(() => {
        console.log('Auth state:', { isAuthenticated, currentUser, authLoading });
        
        if (!authLoading) {
            if (!isAuthenticated) {
                console.log('Not authenticated, redirecting to login');
                navigate('/login', { state: { from: { pathname: '/upload' } } });
                return;
            }

            if (!currentUser?.roles?.includes('Writer') && !currentUser?.roles?.includes('Admin')) {
                console.log('Insufficient permissions, redirecting home');
                navigate('/');
                return;
            }
        }
    }, [isAuthenticated, currentUser, authLoading, navigate]);

    // Fetch filters data
    useEffect(() => {
        const fetchFilters = async () => {
            if (!isAuthenticated || authLoading) return;
            
            setLoading(true);
            try {
                const filters = await filtersApi.getAllFilters();
                setAvailableLanguages(filters.languages || []);
                setAvailableTags(filters.tags || []);
            } catch (err) {
                console.error('Failed to fetch filters:', err);
                setError('Failed to load form data. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };

        fetchFilters();
    }, [isAuthenticated, authLoading]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (error) {
            setError(null);
        }
    };

    const handleMultiSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: prev[name].includes(value)
                ? prev[name].filter(id => id !== value)
                : [...prev[name], value]
        }));
    };

    const handleAddTag = async () => {
        if (!newTag.trim() || addingTag) return;

        setAddingTag(true);
        try {
            const newTagObj = await filtersApi.createTag({ name: newTag.trim() });
            setAvailableTags(prev => [...prev, newTagObj].sort((a, b) => a.name.localeCompare(b.name)));
            setNewTag('');
            
            // Auto-select the new tag
            setFormData(prev => ({
                ...prev,
                tagIds: [...prev.tagIds, newTagObj.id]
            }));
        } catch (err) {
            console.error('Failed to create tag:', err);
            setError(err.response?.data?.message || 'Failed to create tag');
        } finally {
            setAddingTag(false);
        }
    };

    const handleAddLanguage = async () => {
        if (!newLanguage.trim() || addingLanguage) return;

        setAddingLanguage(true);
        try {
            const newLangObj = await filtersApi.createLanguage({ name: newLanguage.trim() });
            setAvailableLanguages(prev => [...prev, newLangObj].sort((a, b) => a.name.localeCompare(b.name)));
            setNewLanguage('');
            
            // Auto-select the new language
            setFormData(prev => ({
                ...prev,
                languageIds: [...prev.languageIds, newLangObj.id]
            }));
        } catch (err) {
            console.error('Failed to create language:', err);
            setError(err.response?.data?.message || 'Failed to create language');
        } finally {
            setAddingLanguage(false);
        }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        
        if (!formData.coverImageUrl.trim()) {
            setError('Cover image URL is required');
            return false;
        }
        
        try {
            new URL(formData.coverImageUrl);
        } catch {
            setError('Please enter a valid cover image URL');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Form submitted, validating...');
        
        if (!validateForm()) {
            return;
        }

        // Double-check authentication before submission
        if (!isAuthenticated || !currentUser) {
            setError('Authentication lost. Please log in again.');
            navigate('/login');
            return;
        }

        setSubmitLoading(true);
        setError(null);

        try {
            console.log('Submitting manga data:', formData);
            
            const newManga = await mangaApi.createManga({
                title: formData.title,
                synopsis: formData.synopsis,
                coverImageUrl: formData.coverImageUrl,
                languageIds: formData.languageIds.length > 0 ? formData.languageIds : null,
                tagIds: formData.tagIds.length > 0 ? formData.tagIds : null
            });

            console.log('Manga created successfully:', newManga);
            setSuccess(true);

            // Redirect to the new manga page after a brief delay
            setTimeout(() => {
                navigate(`/manga/${newManga.id}`);
            }, 1500);

        } catch (err) {
            console.error('Failed to create manga:', err);
            
            // Handle specific error cases
            if (err.response?.status === 401) {
                setError('Your session has expired. Please log in again.');
                navigate('/login');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to create manga series.');
            } else {
                setError(err.response?.data?.message || 'Failed to create manga series. Please try again.');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // Show loading while authentication is being checked
    if (authLoading) {
        return <LoadingSpinner />;
    }

    // Don't render if not authenticated (component will redirect)
    if (!isAuthenticated) {
        return null;
    }

    // Show loading while fetching filters
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="upload-page">
            <h1>Create New Manga Series</h1>

            {error && (
                <div className="error-message">
                    {error}
                    <button 
                        className="close-error" 
                        onClick={() => setError(null)}
                        aria-label="Close error"
                    >
                        ×
                    </button>
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
                        maxLength={200}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="synopsis">Synopsis</label>
                    <textarea
                        id="synopsis"
                        name="synopsis"
                        value={formData.synopsis}
                        onChange={handleInputChange}
                        placeholder="Enter manga synopsis"
                        rows={6}
                        maxLength={2000}
                    />
                    <div className="char-count">
                        {formData.synopsis.length}/2000 characters
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="coverImageUrl">Cover Image URL <span className="required">*</span></label>
                    <input
                        type="url"
                        id="coverImageUrl"
                        name="coverImageUrl"
                        value={formData.coverImageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/cover.jpg"
                        required
                    />
                    {formData.coverImageUrl && (
                        <div className="cover-preview">
                            <img 
                                src={formData.coverImageUrl} 
                                alt="Cover preview" 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                                onLoad={(e) => {
                                    e.target.style.display = 'block';
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Languages</label>
                    <div className="checkbox-grid">
                        {availableLanguages.map(lang => (
                            <label key={lang.id} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={formData.languageIds.includes(lang.id)}
                                    onChange={() => handleMultiSelectChange('languageIds', lang.id)}
                                />
                                {lang.name}
                            </label>
                        ))}
                    </div>
                    
                    <div className="add-new-item">
                        <input
                            type="text"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="Add new language"
                            maxLength={50}
                        />
                        <button
                            type="button"
                            onClick={handleAddLanguage}
                            disabled={addingLanguage || !newLanguage.trim()}
                            className="add-btn"
                        >
                            {addingLanguage ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Tags</label>
                    <div className="checkbox-grid">
                        {availableTags.map(tag => (
                            <label key={tag.id} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={formData.tagIds.includes(tag.id)}
                                    onChange={() => handleMultiSelectChange('tagIds', tag.id)}
                                />
                                {tag.name}
                            </label>
                        ))}
                    </div>
                    
                    <div className="add-new-item">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add new tag"
                            maxLength={50}
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            disabled={addingTag || !newTag.trim()}
                            className="add-btn"
                        >
                            {addingTag ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={() => navigate('/')}
                        className="cancel-btn"
                        disabled={submitLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={submitLoading}
                    >
                        {submitLoading ? 'Creating...' : 'Create Manga Series'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Upload;