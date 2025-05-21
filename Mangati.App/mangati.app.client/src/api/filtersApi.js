// src/api/filtersApi.js
import apiClient from './apiClient';

export const filtersApi = {
    // Get all tags
    getTags: async () => {
        const response = await apiClient.get('/filters/tags');
        return response.data;
    },

    // Create a new tag
    createTag: async (tagData) => {
        const response = await apiClient.post('/filters/tags', tagData);
        return response.data;
    },

    // Get all languages
    getLanguages: async () => {
        const response = await apiClient.get('/filters/languages');
        return response.data;
    },

    // Create a new language (admin only)
    createLanguage: async (languageData) => {
        const response = await apiClient.post('/filters/languages', languageData);
        return response.data;
    },

    // Get all filters
    getAllFilters: async () => {
        const response = await apiClient.get('/filters/all');
        return response.data;
    },

    // Get trending tags
    getTrendingTags: async (limit = 10) => {
        const response = await apiClient.get(`/filters/trending-tags?limit=${limit}`);
        return response.data;
    }
};