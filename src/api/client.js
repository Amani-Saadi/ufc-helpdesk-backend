import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    // Removed default 'Content-Type': 'application/json' so FormData can set its own boundary header
});

// Interceptor to attach JWT token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;