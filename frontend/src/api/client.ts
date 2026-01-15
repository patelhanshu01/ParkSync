import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base configuration
const API_URL = 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for Auth Token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

const MAX_RETRIES = 3;
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);

// Response interceptor for Retries and Error Handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // Retry logic for network errors or 5xx server errors (idempotent operations)
        // Skip for 4xx errors (client error) or if already retried max times
        if (config) {
            const method = (config.method || 'get').toLowerCase();
            const isRetryableMethod = RETRYABLE_METHODS.has(method);
            const status = error.response?.status;
            const isRetryableStatus = status ? status >= 500 : error.code === 'ECONNABORTED';

            if (isRetryableMethod && isRetryableStatus) {
                config._retryCount = config._retryCount || 0;

                if (config._retryCount < MAX_RETRIES) {
                    config._retryCount += 1;
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = Math.pow(2, config._retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return apiClient(config);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
