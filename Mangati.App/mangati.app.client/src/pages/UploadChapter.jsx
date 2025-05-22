
// src/pages/UploadChapter.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mangaApi } from '../api/mangaApi';
import { chapterApi } from '../api/chapterApi';
import { useAuthFetch } from '../hooks/useAuthFetch';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UploadChapter = () => {
    const { mangaId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, currentUser } = useAuthFetch();

    const [manga, setManga] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        number: '',
        pages: []
    });

    const [loading, setLoading] = useState(true);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [preview, setPreview] = useState([]);

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

        // Fetch manga details to verify ownership and get chapter count
        const fetchManga = async () => {
            setLoading(true);
            try {
                const data = await mangaApi.getManga(mangaId);
                setManga(data);

                // Check if user is the author or admin
                if (data.authorId !== currentUser.id && !currentUser.roles.includes('Admin')) {
                    navigate('/');
                    return;
                }

                // Set next chapter number
                const nextChapterNumber = data.chapters && data.chapters.length > 0
                    ? Math.max(...data.chapters.map(c => c.number)) + 1
                    : 1;

                setFormData(prev => ({
                    ...prev,
                    number: nextChapterNumber.toString()
                }));
            } catch (err) {
                console.error('Failed to fetch manga:', err);
                setError('Failed to load manga details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchManga();
    }, [isAuthenticated, currentUser, mangaId, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Validate files
        const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            setError('Please select only image files.');
            return;
        }

        setFormData({ ...formData, pages: files });

        // Generate previews
        const newPreviews = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));

        // Clean up old preview URLs
        preview.forEach(p => URL.revokeObjectURL(p.url));

        setPreview(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!formData.title.trim()) {
            setError('Please enter a title for your chapter.');
            return;
        }

        if (!formData.number.trim() || isNaN(formData.number)) {
            setError('Please enter a valid chapter number.');
            return;
        }

        if (formData.pages.length === 0) {
            setError('Please upload at least one page for your chapter.');
            return;
        }

        setUploadLoading(true);
        setError(null);

        try {
            const newChapter = await chapterApi.createChapter(mangaId, {
                title: formData.title,
                number: parseInt(formData.number, 10),
                pages: formData.pages
            });

            setSuccess(true);

            // Navigate to the new chapter page after a short delay
            setTimeout(() => {
                navigate(`/manga/${mangaId}/chapter/${newChapter.id}`);
            }, 2000);
        } catch (err) {
            console.error('Failed to create chapter:', err);
            setError(err.response?.data?.message || 'Failed to create chapter. Please try again later.');
        } finally {
            setUploadLoading(false);
        }
    };

    const reorderPages = (startIndex, endIndex) => {
        const result = [...formData.pages];
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        // Update previews in the same order
        const previewResult = [...preview];
        const [previewRemoved] = previewResult.splice(startIndex, 1);
        previewResult.splice(endIndex, 0, previewRemoved);

        setFormData({ ...formData, pages: result });
        setPreview(previewResult);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!manga) {
        return <div>Manga not found.</div>;
    }

    return (
        <div className="upload-chapter-page">
            <h1>Upload New Chapter</h1>
            <h2>Manga: {manga.title}</h2>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    Chapter uploaded successfully! Redirecting...
                </div>
            )}

            <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-group">
                    <label htmlFor="title">Chapter Title <span className="required">*</span></label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter chapter title"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="number">Chapter Number <span className="required">*</span></label>
                    <input
                        type="number"
                        id="number"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        placeholder="Enter chapter number"
                        min="1"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="pages">Pages <span className="required">*</span></label>
                    <input
                        type="file"
                        id="pages"
                        name="pages"
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        required
                    />
                    <p className="help-text">Select all pages in the correct order. You can reorder them after upload.</p>
                </div>

                {preview.length > 0 && (
                    <div className="page-previews">
                        <h3>Page Preview</h3>
                        <p>Drag and drop to reorder pages if needed.</p>

                        <div className="preview-grid">
                            {preview.map((file, index) => (
                                <div key={index} className="preview-item">
                                    <div className="page-number">{index + 1}</div>
                                    <img src={file.url} alt={`Page ${index + 1}`} />
                                    <div className="file-name">{file.name}</div>

                                    <div className="reorder-buttons">
                                        <button
                                            type="button"
                                            onClick={() => reorderPages(index, Math.max(0, index - 1))}
                                            disabled={index === 0}
                                            className="move-up-btn"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => reorderPages(index, Math.min(preview.length - 1, index + 1))}
                                            disabled={index === preview.length - 1}
                                            className="move-down-btn"
                                        >
                                            ↓
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="button" onClick={() => navigate(`/manga/${mangaId}`)} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={uploadLoading}>
                        {uploadLoading ? 'Uploading...' : 'Upload Chapter'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadChapter;