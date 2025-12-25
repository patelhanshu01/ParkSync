import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth'; // Ensure this matches your backend

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginAvailable {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

// Create a configured axios instance
const authAxios = axios.create({
    baseURL: API_URL
});

// Add interceptor to add token to requests
authAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (credentials: LoginAvailable): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>('/login', credentials);
    return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>('/register', data);
    return response.data;
};

export const validateToken = async (token: string): Promise<{ valid: boolean, payload: any }> => {
    const response = await authAxios.post('/validate', { token });
    return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await authAxios.get('/me');
    return response.data;
};

export const googleLogin = async (token: string): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>('/google-login', { token });
    return response.data;
};
