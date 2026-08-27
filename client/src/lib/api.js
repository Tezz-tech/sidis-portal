import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

// Double-submit CSRF: the server sets a readable (non-httpOnly) csrfToken
// cookie and only enforces it once an auth cookie is present — a
// cross-site attacker page can't read our cookies to put the value in this
// header (Same-Origin Policy), so this round-trip is what proves the
// request actually came from our own frontend.
function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  if (config.method && config.method.toUpperCase() !== 'GET') {
    const token = readCookie('csrfToken');
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
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
