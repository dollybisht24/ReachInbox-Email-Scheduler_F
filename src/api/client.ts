import axios from 'axios';

export const api = axios.create({
  baseURL: '', // Uses Vite proxy in development
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reachinbox_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login' &&
      !window.location.search.includes('demo=1')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
