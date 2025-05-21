// src/hooks/useManga.js
import { useState, useCallback } from 'react';
import { mangaApi } from '../api/mangaApi';

export const useManga = () => {
    const [mangaList, setMangaList] = useState([]);
    const [manga, setManga] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    const fetchMangaList = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await mangaApi.getMangaList({
                page: params.page || 1,
                pageSize: params.pageSize || 20,
                searchTerm: params.searchTerm,
                status: params.status,
                languageId: params.languageId,
                tagIds: params.tagIds
            });

            setMangaList(response);

            // Extract pagination info from headers
            const totalItems = parseInt(response.headers?.['x-total-count'], 10);
            const totalPages = parseInt(response.headers?.['x-total-pages'], 10);

            setPagination({
                currentPage: params.page || 1,
                totalPages: isNaN(totalPages) ? 1 : totalPages,
                totalItems: isNaN(totalItems) ? 0 : totalItems
            });

            return response;
        } catch (err) {
            setError(err.message || 'Failed to fetch manga list');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchManga = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const data = await mangaApi.getManga(id);
            setManga(data);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to fetch manga details');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createManga = useCallback(async (mangaData) => {
        setLoading(true);
        setError(null);

        try {
            const data = await mangaApi.createManga(mangaData);
            return data;
        } catch (err) {
            setError(err.message || 'Failed to create manga');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateManga = useCallback(async (id, mangaData) => {
        setLoading(true);
        setError(null);

        try {
            await mangaApi.updateManga(id, mangaData);
            // Refresh manga data
            const updatedManga = await mangaApi.getManga(id);
            setManga(updatedManga);
            return updatedManga;
        } catch (err) {
            setError(err.message || 'Failed to update manga');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteManga = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            await mangaApi.deleteManga(id);
            setManga(null);
        } catch (err) {
            setError(err.message || 'Failed to delete manga');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        mangaList,
        manga,
        loading,
        error,
        pagination,
        fetchMangaList,
        fetchManga,
        createManga,
        updateManga,
        deleteManga
    };
};