import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Button, Stack, Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, TextField, Chip } from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getWalletDetails, addFunds, WalletDetails } from '../api/walletApi';
import { useNavigate } from 'react-router-dom';

const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<WalletDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openTopUp, setOpenTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    const navigate = useNavigate();

    const fetchWallet = async () => {
        try {
            const data = await getWalletDetails();
            setWallet(data);
        } catch (err) {
            setError('Failed to load wallet details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleTopUp = async () => {
        const amount = parseFloat(topUpAmount);
        if (isNaN(amount) || amount <= 0) return;

        setProcessing(true);
        try {
            await addFunds(amount);
            setOpenTopUp(false);
            setTopUpAmount('');
            fetchWallet(); // Refresh balance
        } catch (err) {
            setError('Failed to add funds. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!wallet) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={fetchWallet}>
                        Retry
                    </Button>
                }>
                    {error || 'Failed to load wallet information.'}
                </Alert>
                <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                    Back to Map
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    My Wallet
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/')}>
                    Back to Map
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Balance Card */}
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 3
                }}
            >
                <Box>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                        Current Balance
                    </Typography>
                    <Typography variant="h2" fontWeight="bold">
                        ${wallet?.balance.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {wallet?.currency}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<AddCircleIcon />}
                    onClick={() => setOpenTopUp(true)}
                    sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 'bold'
                    }}
                >
                    Add Money
                </Button>
            </Paper>

            {/* Transactions List */}
            <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon /> Transaction History
            </Typography>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {wallet?.transactions.length === 0 ? (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">No transactions yet.</Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />}>
                        {(wallet?.transactions || []).map((transaction) => (
                            <Box
                                key={transaction.id}
                                p={2}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box
                                        sx={{
                                            bgcolor: transaction.type === 'credit' ? 'success.light' : 'error.light',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: '50%',
                                            display: 'flex'
                                        }}
                                    >
                                        {transaction.type === 'credit' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="600">
                                            {transaction.description}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(transaction.date).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                                >
                                    {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

            {/* Top Up Modal */}
            <Dialog open={openTopUp} onClose={() => setOpenTopUp(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogContent>
                    <Box py={2}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Select an amount to add to your parking wallet.
                        </Typography>
                        <Stack direction="row" spacing={1} mb={3}>
                            {[10, 20, 50, 100].map((amt) => (
                                <Chip
                                    key={amt}
                                    label={`$${amt}`}
                                    onClick={() => setTopUpAmount(amt.toString())}
                                    color={topUpAmount === amt.toString() ? 'primary' : 'default'}
                                    variant={topUpAmount === amt.toString() ? 'filled' : 'outlined'}
                                    clickable
                                />
                            ))}
                        </Stack>
                        <TextField
                            label="Amount ($)"
                            type="number"
                            fullWidth
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            InputProps={{ inputProps: { min: 5 } }}
                            helperText="Minimum deposit: $5.00"
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 3 }}
                            onClick={handleTopUp}
                            disabled={!topUpAmount || parseFloat(topUpAmount) < 5 || processing}
                        >
                            {processing ? 'Processing...' : `Pay $${parseFloat(topUpAmount || '0').toFixed(2)}`}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default Wallet;
