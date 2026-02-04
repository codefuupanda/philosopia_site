import axios from 'axios';
import { fetchWithCache } from './cache';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic cached GET request
 * @param {string} endpoint - API endpoint (e.g., '/philosophers')
 * @param {object} params - Query parameters
 * @param {number} ttl - Cache TTL in ms (default 5 min)
 */
export async function cachedGet(endpoint, params = {}, ttl = 5 * 60 * 1000) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const cacheKey = `api:${url}`;

    const { data } = await fetchWithCache(
        cacheKey,
        async () => {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, { params });
            return response.data;
        },
        ttl
    );

    return data;
}

export const api = {
    // Philosophers
    getPhilosophers: (params = {}) => cachedGet('/philosophers', params),
    getPhilosopher: (id) => cachedGet(`/philosophers/${id}`),

    // Periods
    getPeriods: () => cachedGet('/periods'),
    getPeriod: (id) => cachedGet(`/periods/${id}`),

    // Schools
    getSchools: () => cachedGet('/schools'),
    getSchool: (id) => cachedGet(`/schools/${id}`),

    // Concepts
    getConcepts: () => cachedGet('/concepts'),
    getConcept: (id) => cachedGet(`/concepts/${id}`),

    // Beefs
    getBeefs: () => cachedGet('/beefs'),
    getBeef: (id) => cachedGet(`/beefs/${id}`),

    // Works
    getWorks: (lang) => cachedGet('/works', { lang }),

    // Quotes
    getQuotes: (lang, filters = {}) => cachedGet('/quotes', { lang, ...filters }),

    // Artworks
    getArtworks: () => cachedGet('/artworks')
};
