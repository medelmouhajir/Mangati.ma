
// src/api/mangaApi.js
import apiClient from './apiClient';

export const mangaApi = {
    // Get manga list with optional filtering
    getMangaList: async (params = {}) => {
        const response = await apiClient.get('/mangaseries', { params });
        return response.data;
    },

    // Get single manga by ID
    getManga: async (id) => {
        const response = await apiClient.get(`/mangaseries/${id}`);
        return response.data;
    },

    // Create new manga series
    createManga: async (mangaData) => {
        const response = await apiClient.post('/mangaseries', mangaData);
        return response.data;
    },

    // Update manga series
    updateManga: async (id, mangaData) => {
        const response = await apiClient.put(`/mangaseries/${id}`, mangaData);
        return response.data;
    },

    // Delete manga series
    deleteManga: async (id) => {
        const response = await apiClient.delete(`/mangaseries/${id}`);
        return response.data;
    },

    // Add to favorites
    addToFavorites: async (mangaId) => {
        const response = await apiClient.post(`/favorites`, { mangaSeriesId: mangaId });
        return response.data;
    },

    // Remove from favorites
    removeFromFavorites: async (mangaId) => {
        const response = await apiClient.delete(`/favorites/${mangaId}`);
        return response.data;
    },

    // Get user's favorites
    getFavorites: async () => {
        const response = await apiClient.get('/favorites');
        return response.data;
    }
};