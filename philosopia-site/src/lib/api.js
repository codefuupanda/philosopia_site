import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL: API_BASE_URL });

// Plain fetchers returning response.data — caching, dedup, and retries are
// React Query's job now (see src/hooks/queries.js), not this layer's.
const get = async (endpoint, params) => (await client.get(endpoint, { params })).data;

const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const api = {
    // Philosophers
    getPhilosophers: (params = {}) => get('/philosophers', params),
    getPhilosopher: (id) => get(`/philosophers/${id}`),
    getGraphNetwork: () => get('/philosophers/graph/network'),

    // Periods
    getPeriods: () => get('/periods'),
    getPeriod: (id) => get(`/periods/${id}`),

    // Schools
    getSchools: () => get('/schools'),
    getSchool: (id) => get(`/schools/${id}`),

    // Concepts
    getConcepts: () => get('/concepts'),
    getConcept: (id) => get(`/concepts/${id}`),

    // Beefs
    getBeefs: () => get('/beefs'),
    getBeef: (id) => get(`/beefs/${id}`),

    // Works
    getWorks: (lang) => get('/works', { lang }),

    // Quotes
    getQuotes: (lang, filters = {}) => get('/quotes', { lang, ...filters }),

    // Artworks
    getArtworks: () => get('/artworks'),

    // Analytics (admin dashboard)
    getAnalyticsStats: (days) => get('/analytics/stats', { days }),

    // Admin mutations (JWT)
    createBeef: (payload, token) => client.post('/beefs', payload, authHeaders(token)).then((r) => r.data),
    deleteBeef: (id, token) => client.delete(`/beefs/${id}`, authHeaders(token)).then((r) => r.data),
};
