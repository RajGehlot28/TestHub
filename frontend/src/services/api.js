import axios from 'axios';

// DEV  (npm run dev) → '/api' → Vite proxy → http://localhost:5000
// PROD (npm run build + deploy) → Render backend
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://testhub-backend-1rpo.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('testhub_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
