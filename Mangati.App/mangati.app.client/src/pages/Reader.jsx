
// src/pages/Reader.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chapterApi } from '../api/chapterApi';
import { useReader } from '../hooks/useReader';
import PageReader from '../components/reader/PageReader';
import ReaderControls from '../components/reader/ReaderControls';
import ReaderSettings from '../components/reader/ReaderSettings';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reader = () => {
    const { mangaId, chapterId } = useParams();
    const navigate = useNavigate();
    const { settings } = useReader();

    const [chapter, setChapter] = useState(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            try {
                const data = await chapterApi.getChapter(mangaId, chapterId);
                setChapter(data);

                // Check if there's saved progress for this chapter
                const savedProgress = localStorage.getItem(`progress-${chapterId}`);
                if (savedProgress) {
                    setCurrentPageIndex(parseInt(savedProgress, 10));
                }
            } catch (err) {
                console.error('Failed to fetch chapter:', err);
                setError('Failed to load chapter. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchChapter();
    }, [mangaId, chapterId]);

    useEffect(() => {
        // Save reading progress
        if (chapter && currentPageIndex > 0) {
            localStorage.setItem(`progress-${chapterId}`, currentPageIndex.toString());
        }
    }, [chapterId, currentPageIndex, chapter]);

    const handleNextPage = () => {
        if (currentPageIndex < chapter.pages.length - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
        } else {
            // Try to navigate to next chapter if available
            // This would require additional API call to get next chapter
            // For now, just show an alert
            alert('You have reached the end of this chapter');
        }
    };

    const handlePrevPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };

    const handlePageSelect = (index) => {
        setCurrentPageIndex(index);
    };

    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!chapter) {
        return <div>Chapter not found.</div>;
    }

    return (
        <div className={`reader-container ${settings.theme} ${settings.readingMode}`}>
            <div className="reader-header">
                <h2>{chapter.title}</h2>
                <button onClick={() => navigate(`/manga/${mangaId}`)}>Back to Manga</button>
            </div>

            <PageReader
                pages={chapter.pages}
                currentPageIndex={currentPageIndex}
                readingMode={settings.readingMode}
                fitToWidth={settings.fitToWidth}
                zoomLevel={settings.zoomLevel}
            />

            <ReaderControls
                currentPage={currentPageIndex + 1}
                totalPages={chapter.pages.length}
                onNextPage={handleNextPage}
                onPrevPage={handlePrevPage}
                onPageSelect={handlePageSelect}
                onToggleSettings={toggleSettings}
            />

            {showSettings && (
                <ReaderSettings onClose={toggleSettings} />
            )}
        </div>
    );
};

export default Reader;