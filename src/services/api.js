import axios from 'axios';

// Normalize base URL without duplicating `/api`
const getBaseUrl = () => {
  const rawBase = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
  return rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
};

const normalizedBase = getBaseUrl();

const api = axios.create({
  baseURL: normalizedBase,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (Attach Bearer token if stored in localStorage)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Queue for handling concurrent requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor for handling 401 & Silent Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestUrl = String(originalRequest.url || '');

    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${normalizedBase}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshRes.data?.success || refreshRes.status === 200) {
          if (refreshRes.data?.accessToken) {
            localStorage.setItem('token', refreshRes.data.accessToken);
          }
          processQueue(null, refreshRes.data?.accessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-changed'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;