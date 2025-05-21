
// src/components/manga/MangaCard.jsx
import { Link } from 'react-router-dom';

const MangaCard = ({ manga }) => {
    return (
        <div className="manga-card">
            <Link to={`/manga/${manga.id}`} className="manga-card-link">
                <div className="manga-card-cover">
                    <img src={manga.coverImageUrl} alt={manga.title} />
                </div>

                <div className="manga-card-info">
                    <h3 className="manga-card-title">{manga.title}</h3>

                    <div className="manga-card-meta">
                        <span className="manga-card-status">
                            {manga.status === 0 ? 'Ongoing' : 'Completed'}
                        </span>

                        {manga.tags && manga.tags.length > 0 && (
                            <div className="manga-card-tags">
                                {manga.tags.slice(0, 3).map(tag => (
                                    <span key={tag.id} className="tag-pill">
                                        {tag.name}
                                    </span>
                                ))}
                                {manga.tags.length > 3 && (
                                    <span className="tag-pill more-tags">+{manga.tags.length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default MangaCard;