import apiClient from './client';

const WALLET_BASE = '/wallet';

export interface Transaction {
    id: number;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    date: string;
    reservation_id?: number;
}

export interface SavedCard {
    id: number;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    cardholder?: string;
    isDefault?: boolean;
}

export interface WalletDetails {
    balance: number;
    currency: string;
    transactions: Transaction[];
    savedCards?: SavedCard[];
}

export interface CreateSavedCardInput {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    cardholder?: string;
    isDefault?: boolean;
}

export const getWalletDetails = async (): Promise<WalletDetails> => {
    const response = await apiClient.get<WalletDetails>(`${WALLET_BASE}/`);
    return response.data;
};

export const addFunds = async (amount: number, cardId?: number): Promise<{ success: boolean; new_balance: number }> => {
    const payload: { amount: number; cardId?: number } = { amount };
    if (cardId) {
        payload.cardId = cardId;
    }
    const response = await apiClient.post<{ success: boolean; new_balance: number }>(`${WALLET_BASE}/top-up`, payload);
    return response.data;
};

export const applyWalletCredit = async (reservationId: number, amount: number): Promise<{ success: boolean; new_balance: number }> => {
    const response = await apiClient.post<{ success: boolean; new_balance: number }>(`${WALLET_BASE}/apply`, {
        reservation_id: reservationId,
        amount
    });
    return response.data;
};

export const addSavedCard = async (payload: CreateSavedCardInput): Promise<SavedCard> => {
    const response = await apiClient.post<SavedCard>(`${WALLET_BASE}/cards`, payload);
    return response.data;
};
