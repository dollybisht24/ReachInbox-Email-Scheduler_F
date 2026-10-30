import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
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
    // Only redirect if backend explicitly responded with 401 AND user has no active local session
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login' &&
      !localStorage.getItem('reachinbox_user')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
