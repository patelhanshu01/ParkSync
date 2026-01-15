import React, { useEffect, useMemo, useState } from 'react';
import { getWalletDetails, WalletDetails } from '../api/walletApi';

interface WalletDisplayProps {
    showTransactions?: boolean;
    onApplyCredit?: (amount: number) => void;
}

const WalletDisplay: React.FC<WalletDisplayProps> = ({ showTransactions = false, onApplyCredit }) => {
    const [wallet, setWallet] = useState<WalletDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const data = await getWalletDetails();
                setWallet(data);
            } catch (error) {
                console.error('Failed to fetch wallet:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    const containerStyle: React.CSSProperties = {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '20px',
        minHeight: '180px'
    };

    const placeholderBar = (width: string) => ({
        height: '14px',
        width,
        borderRadius: '6px',
        background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%)',
        backgroundSize: '400% 100%',
        animation: 'walletSkeleton 1.4s ease infinite'
    });

    const actionSlotStyle: React.CSSProperties = {
        height: '38px',
        marginBottom: '12px'
    };

    const recentTransactions = useMemo(() => {
        if (!showTransactions || !wallet) return [];
        const count = Math.min(5, wallet.transactions.length);
        const items = new Array(count);
        for (let i = 0; i < count; i++) {
            const transaction = wallet.transactions[i];
            items[i] = {
                ...transaction,
                dateLabel: new Date(transaction.date).toLocaleDateString(),
                isCredit: transaction.type === 'credit'
            };
        }
        return items;
    }, [showTransactions, wallet]);

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={placeholderBar('120px')} />
                    <div style={placeholderBar('90px')} />
                </div>
                <div style={actionSlotStyle}>
                    <div style={{ ...placeholderBar('100%'), height: '100%', borderRadius: '8px' }} />
                </div>
                <div style={placeholderBar('60%')} />
                <style>
                    {`@keyframes walletSkeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}
                </style>
            </div>
        );
    }
    if (!wallet) {
        return (
            <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Wallet unavailable
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>💳 Wallet</h3>
                <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#28a745'
                }}>
                    ${wallet.balance.toFixed(2)}
                </div>
            </div>

            <div style={actionSlotStyle}>
                {wallet.balance > 0 && onApplyCredit && (
                    <button
                        onClick={() => onApplyCredit(wallet.balance)}
                        style={{
                            width: '100%',
                            height: '100%',
                            padding: '12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Apply ${wallet.balance.toFixed(2)} to Booking
                    </button>
                )}
            </div>

            {showTransactions && wallet.transactions.length > 0 && (
                <div>
                    <h4>Recent Transactions</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {recentTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                style={{
                                    padding: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                        {transaction.description}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                        {transaction.dateLabel}
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: '700',
                                    color: transaction.isCredit ? '#28a745' : '#dc3545'
                                }}>
                                    {transaction.isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletDisplay;
