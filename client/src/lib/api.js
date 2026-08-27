import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

// Double-submit CSRF: the API sets a csrfToken cookie and only enforces it
// once an auth cookie is present. Client and API are different origins, so
// document.cookie here can never read a cookie the API set — instead the
// API echoes the current value back on the X-CSRF-Token response header of
// every response (exposed cross-origin via CORS's exposedHeaders), and this
// caches it in memory to replay on the next write. A forged cross-site
// request can't read that header either, since CORS never allowed its
// origin in the first place — that's what still makes this a real defense.
let csrfToken = null;

api.interceptors.request.use((config) => {
  if (config.method && config.method.toUpperCase() !== 'GET' && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const token = response.headers['x-csrf-token'];
    if (token) csrfToken = token;
    return response;
  },
  (error) => {
    const token = error.response?.headers?.['x-csrf-token'];
    if (token) csrfToken = token;
    throw error;
  },
);

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
