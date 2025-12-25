import axios from 'axios';

const API_URL = 'http://localhost:3000/api/wallet';

const walletAxios = axios.create({
    baseURL: API_URL
});

walletAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface Transaction {
    id: number;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    date: string;
    reservation_id?: number;
}

export interface WalletDetails {
    balance: number;
    currency: string;
    transactions: Transaction[];
}

export const getWalletDetails = async (): Promise<WalletDetails> => {
    const response = await walletAxios.get<WalletDetails>('/');
    return response.data;
};

export const addFunds = async (amount: number): Promise<{ success: boolean; new_balance: number }> => {
    const response = await walletAxios.post<{ success: boolean; new_balance: number }>('/top-up', { amount });
    return response.data;
};
