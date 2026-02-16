import axios from 'axios';

const DEV_API_BASE_URL = 'http://localhost:3000/api';
const PROD_API_BASE_URL = 'https://dbs-db.onrender.com/api';
const USE_PROD_API = true;

const api = axios.create({
  baseURL: USE_PROD_API ? PROD_API_BASE_URL : DEV_API_BASE_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bb_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
