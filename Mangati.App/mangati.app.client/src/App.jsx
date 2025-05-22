// In src/App.jsx - update the import
import { AuthProvider } from './context/AuthContext'; // Updated import
import { ReaderProvider } from './context/ReaderContext';
import AppRoutes from './routes';

function App() {
    return (
        <AuthProvider>
            <ReaderProvider>
                <AppRoutes />
            </ReaderProvider>
        </AuthProvider>
    );
}

export default App;