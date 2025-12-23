import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:3001/v1',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized - Auto Logout
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
           window.location.href = '/login';
        }
      }
    } 
    // 500+ Server Errors
    else if (error.response?.status >= 500) {
        toast.error('System Failure', {
            description: 'The central server is unreachable. Please try again later.'
        });
    }
    // Network Errors
    else if (!error.response) {
        toast.error('Connection Lost', {
            description: 'Unable to establish a secure link with the server.'
        });
    }

    return Promise.reject(error);
  }
);

export default api;
