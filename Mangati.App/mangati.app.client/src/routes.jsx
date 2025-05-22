// src/routes.jsx - Updated with DeniedAccess route
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
import UploadChapter from './pages/UploadChapter';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './components/common/NotFound';
import DeniedAccess from './components/common/DeniedAccess';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole, requiredRoles = [] }) => {
    const { isAuthenticated, currentUser, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} />;
    }

    // Check for specific role requirement
    if (requiredRole && !currentUser.roles.includes(requiredRole)) {
        return <Navigate to="/denied-access" />;
    }

    // Check for multiple role requirements (user needs at least one)
    if (requiredRoles.length > 0 && !requiredRoles.some(role => currentUser.roles.includes(role))) {
        return <Navigate to="/denied-access" />;
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

                {/* Access denied route */}
                <Route path="denied-access" element={<DeniedAccess />} />

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
                        <ProtectedRoute requiredRoles={["Writer", "Admin"]}>
                            <Upload />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="manga/:mangaId/upload-chapter"
                    element={
                        <ProtectedRoute requiredRoles={["Writer", "Admin"]}>
                            <UploadChapter />
                        </ProtectedRoute>
                    }
                />

                {/* Admin only routes */}
                <Route
                    path="admin/*"
                    element={
                        <ProtectedRoute requiredRole="Admin">
                            <div>Admin Panel (implement admin routes here)</div>
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