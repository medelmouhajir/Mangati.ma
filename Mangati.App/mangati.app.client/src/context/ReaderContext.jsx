// src/context/ReaderContext.jsx
import { createContext, useState, useEffect } from 'react';

export const ReaderContext = createContext();

const defaultSettings = {
    theme: 'light',
    readingMode: 'pageFlip', // pageFlip or verticalScroll
    fitToWidth: true,
    zoomLevel: 100,
};

export const ReaderProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('readerSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('readerSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    const value = {
        settings,
        updateSettings,
        resetSettings,
    };

    return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
};