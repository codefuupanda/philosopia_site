import axios from 'axios';

// Ensure this matches your backend port
const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
    getWorks: async (lang) => {
        // Returns list of works. 
        // Backend should handle basic population of philosopher names.
        const response = await axios.get(`${API_BASE_URL}/works?lang=${lang}`);
        return response.data;
    },

    getQuotes: async (lang, filters = {}) => {
        // filters can be { tag: 'ethics', philosopherId: 'plato' }
        const params = new URLSearchParams({ lang, ...filters });
        const response = await axios.get(`${API_BASE_URL}/quotes?${params.toString()}`);
        return response.data;
    }
};
