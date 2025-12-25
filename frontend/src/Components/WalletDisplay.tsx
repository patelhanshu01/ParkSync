import React, { useEffect, useState } from 'react';
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

    if (loading) return <div>Loading wallet...</div>;
    if (!wallet) return <div>Wallet unavailable</div>;

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
        }}>
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

            {wallet.balance > 0 && onApplyCredit && (
                <button
                    onClick={() => onApplyCredit(wallet.balance)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginBottom: '12px'
                    }}
                >
                    Apply ${wallet.balance.toFixed(2)} to Booking
                </button>
            )}

            {showTransactions && wallet.transactions.length > 0 && (
                <div>
                    <h4>Recent Transactions</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {wallet.transactions.slice(0, 5).map((transaction) => (
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
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: '700',
                                    color: transaction.type === 'credit' ? '#28a745' : '#dc3545'
                                }}>
                                    {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
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
