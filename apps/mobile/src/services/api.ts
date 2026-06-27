import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

// Logout callback - will be set by auth store
let logoutCallback: (() => Promise<void>) | null = null;

// Token refresh callback - will be set by socket service
let tokenRefreshCallback: (() => Promise<void>) | null = null;

export const setLogoutCallback = (callback: () => Promise<void>) => {
  logoutCallback = callback;
};

export const setTokenRefreshCallback = (callback: () => Promise<void>) => {
  tokenRefreshCallback = callback;
};

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Token Helpers ────────────────────────────────────────────────────────────

const getAccessToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: STORAGE_KEYS.ACCESS_TOKEN,
    });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
};

const getRefreshToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: STORAGE_KEYS.REFRESH_TOKEN,
    });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
};

export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  console.log('[API] Saving tokens to Keychain:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenPreview: accessToken.substring(0, 20) + '...',
  });
  
  await Promise.all([
    Keychain.setGenericPassword('token', accessToken, {
      service: STORAGE_KEYS.ACCESS_TOKEN,
    }),
    Keychain.setGenericPassword('token', refreshToken, {
      service: STORAGE_KEYS.REFRESH_TOKEN,
    }),
  ]);
  
  console.log('[API] Tokens saved successfully');
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.ACCESS_TOKEN }),
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.REFRESH_TOKEN }),
  ]);
};

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Request with token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPreview: token.substring(0, 20) + '...',
      });
    } else {
      console.log('[API] Request without token:', {
        url: config.url,
        method: config.method,
      });
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor (Token Refresh) ────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enhanced error logging for debugging
    console.log('[API] Request failed:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      message: error.message,
      code: error.code,
      hasResponse: !!error.response,
      status: error.response?.status,
    });

    if (error.response) {
      console.log('[API] Error response data:', error.response.data);
    } else if (error.request) {
      console.log('[API] No response received. Request config:', {
        url: error.request._url,
        headers: error.request._headers,
      });
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle token expiration
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      console.log('[API] 401 error, attempting token refresh:', { errorCode });
      
      // Try to refresh token first
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token as string}`;
            }
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) {
            console.log('[API] No refresh token available, logging out');
            throw new Error('No refresh token');
          }

          console.log('[API] Attempting to refresh token...');
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = data.data as {
            accessToken: string;
            refreshToken: string;
          };

          console.log('[API] Token refreshed successfully');
          await saveTokens(accessToken, newRefreshToken);
          processQueue(null, accessToken);

          // Notify socket service about new token
          if (tokenRefreshCallback) {
            try {
              await tokenRefreshCallback();
            } catch (err) {
              console.warn('[API] Socket reconnect failed (non-critical):', err);
            }
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          console.log('[API] Token refresh failed, logging out');
          processQueue(refreshError, null);
          await clearTokens();
          // Call logout callback if set
          if (logoutCallback) {
            await logoutCallback();
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
