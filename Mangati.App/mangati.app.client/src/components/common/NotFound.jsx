
// src/components/common/NotFound.jsx
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist or has been moved.</p>
            <Link to="/" className="home-link">Go to Homepage</Link>
        </div>
    );
};

export default NotFound;