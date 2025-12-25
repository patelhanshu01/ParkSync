export interface Wallet {
    balance: number;
    currency: string;
    transactions: WalletTransaction[];
}

export interface WalletTransaction {
    id: number;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    date: string;
    reservation_id?: number;
}

export interface WalletRefund {
    amount: number;
    reason: string;
    reservation_id: number;
}
