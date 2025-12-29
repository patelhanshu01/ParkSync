import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, LoginAvailable, RegisterData, login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, getCurrentUser } from '../api/authApi';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: LoginAvailable) => Promise<User>;
    googleLogin: (token: string) => Promise<User>;
    register: (data: RegisterData) => Promise<User>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Initial check for existing token
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    // Ideally verify token or fetch user profile
                    // For now, we'll optimistically assume token is valid if we have user data stored
                    // Or fetch it:
                    const userData = await getCurrentUser();
                    setUser(userData);
                } catch (err) {
                    // Token invalid or expired
                    console.error("Session expired", err);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [token]);

    const login = async (credentials: LoginAvailable): Promise<User> => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiLogin(credentials);
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);
            // Optionally store user info or just rely on fetch
            return data.user;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async (token: string): Promise<User> => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiGoogleLogin(token);
            setToken(result.token);
            setUser(result.user);
            localStorage.setItem('token', result.token);
            return result.user;
        } catch (err: any) {
            console.error("Google Login API Error:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Google Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterData): Promise<User> => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiRegister(data);
            setToken(result.token);
            setUser(result.user);
            localStorage.setItem('token', result.token);
            return result.user;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            loading,
            login,
            googleLogin,
            register,
            logout,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
