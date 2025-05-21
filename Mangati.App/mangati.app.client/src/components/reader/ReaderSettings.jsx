
// src/components/reader/ReaderSettings.jsx
import { useReader } from '../../hooks/useReader';

const ReaderSettings = ({ onClose }) => {
    const { settings, updateSettings, resetSettings } = useReader();

    const handleThemeChange = (e) => {
        updateSettings({ theme: e.target.value });
    };

    const handleReadingModeChange = (e) => {
        updateSettings({ readingMode: e.target.value });
    };

    const handleFitToWidthChange = (e) => {
        updateSettings({ fitToWidth: e.target.checked });
    };

    const handleZoomChange = (e) => {
        updateSettings({ zoomLevel: parseInt(e.target.value, 10) });
    };

    return (
        <div className="reader-settings-panel">
            <div className="settings-header">
                <h3>Reader Settings</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>

            <div className="settings-group">
                <label>
                    Theme:
                    <select value={settings.theme} onChange={handleThemeChange}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </label>
            </div>

            <div className="settings-group">
                <label>
                    Reading Mode:
                    <select value={settings.readingMode} onChange={handleReadingModeChange}>
                        <option value="pageFlip">Page Flip</option>
                        <option value="verticalScroll">Vertical Scroll</option>
                    </select>
                </label>
            </div>

            <div className="settings-group">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.fitToWidth}
                        onChange={handleFitToWidthChange}
                    />
                    Fit to Width
                </label>
            </div>

            <div className="settings-group">
                <label>
                    Zoom Level: {settings.zoomLevel}%
                    <input
                        type="range"
                        min="50"
                        max="200"
                        step="10"
                        value={settings.zoomLevel}
                        onChange={handleZoomChange}
                    />
                </label>
            </div>

            <button onClick={resetSettings} className="reset-btn">
                Reset to Defaults
            </button>
        </div>
    );
};

export default ReaderSettings;