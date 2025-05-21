// src/routes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import MangaView from './pages/MangaView';
import Reader from './pages/Reader';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './components/common/NotFound';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, currentUser, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && !currentUser.roles.includes(requiredRole)) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                {/* Public routes */}
                <Route index element={<Home />} />
                <Route path="browse" element={<Browse />} />
                <Route path="manga/:id" element={<MangaView />} />
                <Route path="manga/:mangaId/chapter/:chapterId" element={<Reader />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />

                {/* Protected routes */}
                <Route
                    path="profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Writer/Admin routes */}
                <Route
                    path="upload"
                    element={
                        <ProtectedRoute requiredRole="Writer">
                            <Upload />
                        </ProtectedRoute>
                    }
                />

                {/* Not found */}
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;