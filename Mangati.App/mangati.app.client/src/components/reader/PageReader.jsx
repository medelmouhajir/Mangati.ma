
// src/components/reader/PageReader.jsx
import { useState, useEffect } from 'react';

const PageReader = ({ pages, currentPageIndex, readingMode, fitToWidth, zoomLevel }) => {
    const [loaded, setLoaded] = useState([]);

    useEffect(() => {
        setLoaded(new Array(pages.length).fill(false));
    }, [pages]);

    const handleImageLoad = (index) => {
        setLoaded((prev) => {
            const newLoaded = [...prev];
            newLoaded[index] = true;
            return newLoaded;
        });
    };

    // Calculate styles based on reader settings
    const getImageStyle = () => {
        const styles = {};

        if (fitToWidth) {
            styles.width = '100%';
            styles.height = 'auto';
        } else {
            styles.width = `${zoomLevel}%`;
            styles.height = 'auto';
        }

        return styles;
    };

    if (readingMode === 'verticalScroll') {
        return (
            <div className="vertical-reader">
                {pages.map((page, index) => (
                    <div key={page.id} className="page-container">
                        {!loaded[index] && <div className="page-loading">Loading page {index + 1}...</div>}
                        <img
                            src={page.imageUrl}
                            alt={`Page ${index + 1}`}
                            style={getImageStyle()}
                            onLoad={() => handleImageLoad(index)}
                            className={loaded[index] ? 'loaded' : 'loading'}
                        />
                    </div>
                ))}
            </div>
        );
    }

    // Page flip mode (default)
    return (
        <div className="page-flip-reader">
            {!loaded[currentPageIndex] && <div className="page-loading">Loading page {currentPageIndex + 1}...</div>}
            <img
                src={pages[currentPageIndex].imageUrl}
                alt={`Page ${currentPageIndex + 1}`}
                style={getImageStyle()}
                onLoad={() => handleImageLoad(currentPageIndex)}
                className={loaded[currentPageIndex] ? 'loaded' : 'loading'}
            />
        </div>
    );
};

export default PageReader;