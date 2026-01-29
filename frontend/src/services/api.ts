import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CSRF cookies
});

// CSRF token storage
let csrfToken: string | null = null;

// Function to fetch CSRF token
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/csrf-token`,
      { withCredentials: true }
    );
    csrfToken = response.data.csrfToken;
    if (!csrfToken) {
      throw new Error('CSRF token not received from server');
    }
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

// Initialize CSRF token on app load
fetchCsrfToken().catch(console.error);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - attach JWT token and CSRF token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();

    // Attach JWT token
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Attach CSRF token for state-changing requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      if (!csrfToken) {
        // Fetch CSRF token if not available
        try {
          await fetchCsrfToken();
        } catch (error) {
          console.error('Failed to fetch CSRF token:', error);
        }
      }
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 403 Forbidden - might be CSRF token issue
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh CSRF token
      try {
        await fetchCsrfToken();
        if (csrfToken && originalRequest.headers) {
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
        }
        return api(originalRequest);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setAccessToken, clearAuth } =
        useAuthStore.getState();

      if (!refreshToken) {
        // No refresh token available, clear auth and redirect to login
        clearAuth();
        processQueue(new Error('No refresh token available'), null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken } = response.data;

        // Update the access token in store
        setAccessToken(newAccessToken);

        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Process queued requests
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        processQueue(refreshError as Error, null);
        clearAuth();
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    handleApiError(error);

    return Promise.reject(error);
  }
);

// Error handling helper
const handleApiError = (error: AxiosError) => {
  const { addToast } = useUIStore.getState();

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 400:
        addToast(
          data?.error?.message || 'Invalid request. Please check your input.',
          'error'
        );
        break;
      case 401:
        addToast(
          data?.error?.message || 'Authentication required. Please log in.',
          'error'
        );
        break;
      case 403:
        addToast(
          data?.error?.message || 'You do not have permission to perform this action.',
          'error'
        );
        break;
      case 404:
        addToast(
          data?.error?.message || 'The requested resource was not found.',
          'error'
        );
        break;
      case 409:
        addToast(
          data?.error?.message || 'A conflict occurred. Please try again.',
          'error'
        );
        break;
      case 429:
        addToast(
          data?.error?.message || 'Too many requests. Please try again later.',
          'error'
        );
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        addToast(
          'Server error. Please try again later.',
          'error'
        );
        break;
      default:
        addToast(
          data?.error?.message || 'An unexpected error occurred.',
          'error'
        );
    }
  } else if (error.request) {
    // Request made but no response received
    addToast(
      'Network error. Please check your connection and try again.',
      'error'
    );
  } else {
    // Something else happened
    addToast(
      'An unexpected error occurred. Please try again.',
      'error'
    );
  }
};

export default api;
