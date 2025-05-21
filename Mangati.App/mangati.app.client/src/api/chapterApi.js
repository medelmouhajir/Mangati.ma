
// src/api/chapterApi.js
import apiClient from './apiClient';

export const chapterApi = {
    // Get chapters for a manga
    getChapters: async (mangaId, params = {}) => {
        const response = await apiClient.get(`/manga/${mangaId}/chapter`, { params });
        return response.data;
    },

    // Get single chapter with pages
    getChapter: async (mangaId, chapterId) => {
        const response = await apiClient.get(`/manga/${mangaId}/chapter/${chapterId}`);
        return response.data;
    },

    // Create new chapter
    createChapter: async (mangaId, chapterData) => {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('title', chapterData.title);

        if (chapterData.number) {
            formData.append('number', chapterData.number);
        }

        // Append all page images
        if (chapterData.pages && chapterData.pages.length > 0) {
            chapterData.pages.forEach((file, index) => {
                formData.append(`pages[${index}]`, file);
            });
        }

        const response = await apiClient.post(`/manga/${mangaId}/chapter`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Update chapter status (admin only)
    updateChapterStatus: async (mangaId, chapterId, status) => {
        const response = await apiClient.put(`/manga/${mangaId}/chapter/${chapterId}/status`, { status });
        return response.data;
    },

    // Delete chapter
    deleteChapter: async (mangaId, chapterId) => {
        const response = await apiClient.delete(`/manga/${mangaId}/chapter/${chapterId}`);
        return response.data;
    }
};