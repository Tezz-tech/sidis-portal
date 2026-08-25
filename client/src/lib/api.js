import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || config._retry || config.url?.includes('/auth/')) {
      throw error;
    }

    if (isRefreshing) {
      await new Promise((resolve, reject) => pendingQueue.push({ resolve, reject }));
      return api(config);
    }

    config._retry = true;
    isRefreshing = true;
    try {
      await api.post('/api/auth/refresh');
      resolveQueue(null);
      return api(config);
    } catch (refreshError) {
      resolveQueue(refreshError);
      throw error;
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

export function apiErrorMessage(error, fallback = 'Something went wrong on our end. Try again in a moment.') {
  return error?.response?.data?.error?.message || fallback;
}
