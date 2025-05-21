// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mangaApi } from '../api/mangaApi';
import MangaCard from '../components/manga/MangaCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
    const [latestManga, setLatestManga] = useState([]);
    const [popularManga, setPopularManga] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMangaData = async () => {
            setLoading(true);
            try {
                // Get latest updated manga
                const latestData = await mangaApi.getMangaList({
                    page: 1,
                    pageSize: 6,
                    // Sort by updated date is handled on server by default
                });
                setLatestManga(latestData);

                // This would require a dedicated endpoint for popular manga
                // For now, just use the same data
                setPopularManga(latestData);
            } catch (err) {
                console.error('Failed to fetch manga data:', err);
                setError('Failed to load manga. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMangaData();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="home-page">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to Mangatis</h1>
                    <p>Discover and read your favorite manga series</p>
                    <Link to="/browse" className="cta-button">Browse Manga</Link>
                </div>
            </section>

            <section className="latest-manga">
                <div className="section-header">
                    <h2>Latest Updates</h2>
                    <Link to="/browse" className="view-all">View All</Link>
                </div>

                <div className="manga-grid">
                    {latestManga.map(manga => (
                        <MangaCard key={manga.id} manga={manga} />
                    ))}
                </div>
            </section>

            <section className="popular-manga">
                <div className="section-header">
                    <h2>Popular Series</h2>
                    <Link to="/browse" className="view-all">View All</Link>
                </div>

                <div className="manga-grid">
                    {popularManga.map(manga => (
                        <MangaCard key={manga.id} manga={manga} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;