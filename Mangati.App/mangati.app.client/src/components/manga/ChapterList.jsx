
// src/components/manga/ChapterList.jsx
import { Link } from 'react-router-dom';

const ChapterList = ({ chapters, mangaId }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div className="chapter-list">
            <table>
                <thead>
                    <tr>
                        <th>Chapter</th>
                        <th>Title</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {chapters.map(chapter => (
                        <tr key={chapter.id} className="chapter-item">
                            <td className="chapter-number">
                                <Link to={`/manga/${mangaId}/chapter/${chapter.id}`}>
                                    Chapter {chapter.number}
                                </Link>
                            </td>
                            <td className="chapter-title">
                                <Link to={`/manga/${mangaId}/chapter/${chapter.id}`}>
                                    {chapter.title}
                                </Link>
                            </td>
                            <td className="chapter-date">
                                {formatDate(chapter.uploadedAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ChapterList;