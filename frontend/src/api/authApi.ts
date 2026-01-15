import apiClient from './client';

// Helper to keep paths relative to the base URL
const AUTH_BASE = '/auth';

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
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
    role?: string;
}

export const login = async (credentials: LoginAvailable): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login`, credentials);
    return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE}/register`, data);
    return response.data;
};

export const validateToken = async (token: string): Promise<{ valid: boolean, payload: any }> => {
    const response = await apiClient.post(`${AUTH_BASE}/validate`, { token });
    return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await apiClient.get(`${AUTH_BASE}/me`);
    return response.data;
};

export const googleLogin = async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE}/google-login`, { token });
    return response.data;
};
