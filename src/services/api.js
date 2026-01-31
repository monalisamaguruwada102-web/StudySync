import axios from 'axios';

// In production (Vite build), we want to use relative paths so the browser 
// talks to the same domain that's serving the frontend.
// In development, we fallback to the VITE_API_URL or localhost.
const API_URL = import.meta.env.PROD
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

export const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
