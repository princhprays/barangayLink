import axios from 'axios';

let accessToken = null;

// Use environment variable for API URL, fallback to relative path for proxy
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const bootstrapToken = () => {
  const saved = localStorage.getItem('token');
  if (saved && typeof saved === 'string' && saved.trim().length > 0) {
    accessToken = saved;
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    accessToken = null;
    delete api.defaults.headers.common.Authorization;
  }
};

export const setAccessToken = (token) => {
  if (token) {
    accessToken = token;
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    accessToken = null;
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
  }
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use(
  (config) => {
    if (!config.headers) config.headers = {};
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      // Optionally handle global 401
    }
    return Promise.reject(error);
  }
);

bootstrapToken();

export default api;


