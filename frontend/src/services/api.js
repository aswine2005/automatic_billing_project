import axios from 'axios';
import { getToken, clearToken } from './auth';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

console.log('API BASE URL:', apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.log(error.response || error.message);
    if (error.response && error.response.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
