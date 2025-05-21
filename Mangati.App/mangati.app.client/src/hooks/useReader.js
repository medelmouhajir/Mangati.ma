
// src/hooks/useReader.js
import { useContext } from 'react';
import { ReaderContext } from '../context/ReaderContext';

export const useReader = () => {
    const context = useContext(ReaderContext);
    if (context === undefined) {
        throw new Error('useReader must be used within a ReaderProvider');
    }
    return context;
};