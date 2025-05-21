
// src/pages/Browse.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useManga } from '../hooks/useManga';
import MangaCard from '../components/manga/MangaCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';

const Browse = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { fetchMangaList, mangaList, loading, error, pagination } = useManga();
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);

    // Form state
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [languageId, setLanguageId] = useState(searchParams.get('language') || '');
    const [selectedTags, setSelectedTags] = useState(searchParams.getAll('tag') || []);

    // Fetch initial data and filters
    useEffect(() => {
        const fetchData = async () => {
            // Fetch manga with current filters
            await fetchMangaList({
                page: searchParams.get('page') || 1,
                searchTerm: searchParams.get('search'),
                status: searchParams.get('status'),
                languageId: searchParams.get('language'),
                tagIds: searchParams.getAll('tag')
            });

            // In a real app, you would fetch languages and tags from the API
            // For now, just set some placeholder data
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
        };

        fetchData();
    }, [fetchMangaList, searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();

        // Update search params
        const params = new URLSearchParams();

        if (searchTerm) params.set('search', searchTerm);
        if (status) params.set('status', status);
        if (languageId) params.set('language', languageId);

        selectedTags.forEach(tag => {
            params.append('tag', tag);
        });

        // Reset to page 1 when filtering changes
        params.set('page', '1');

        setSearchParams(params);
    };

    const handleTagToggle = (tagId) => {
        setSelectedTags(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(id => id !== tagId);
            } else {
                return [...prev, tagId];
            }
        });
    };

    const handlePageChange = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatus('');
        setLanguageId('');
        setSelectedTags([]);
        setSearchParams({});
    };

    return (
        <div className="browse-page">
            <h1>Browse Manga</h1>

            <div className="browse-container">
                <aside className="filter-sidebar">
                    <h2>Filters</h2>

                    <form onSubmit={handleSearch} className="filter-form">
                        <div className="form-group">
                            <label htmlFor="searchTerm">Search</label>
                            <input
                                type="text"
                                id="searchTerm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title or synopsis"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="0">Ongoing</option>
                                <option value="1">Completed</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="language">Language</label>
                            <select
                                id="language"
                                value={languageId}
                                onChange={(e) => setLanguageId(e.target.value)}
                            >
                                <option value="">All Languages</option>
                                {languages.map(lang => (
                                    <option key={lang.id} value={lang.id.toString()}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Tags</label>
                            <div className="tags-list">
                                {tags.map(tag => (
                                    <label key={tag.id} className="tag-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.includes(tag.id.toString())}
                                            onChange={() => handleTagToggle(tag.id.toString())}
                                        />
                                        {tag.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button type="submit" className="apply-filters-btn">
                                Apply Filters
                            </button>
                            <button type="button" onClick={clearFilters} className="clear-filters-btn">
                                Clear Filters
                            </button>
                        </div>
                    </form>
                </aside>

                <div className="results-container">
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : mangaList.length === 0 ? (
                        <div className="no-results">
                            <p>No manga found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            <div className="manga-grid">
                                {mangaList.map(manga => (
                                    <MangaCard key={manga.id} manga={manga} />
                                ))}
                            </div>

                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Browse;